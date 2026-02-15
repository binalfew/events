# Module 07: API and Integration Layer

> **Module:** 07 - API and Integration Layer
> **Version:** 1.0
> **Last Updated:** February 11, 2026
> **Status:** Draft
> **Requires:** [Module 00: Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md), [Module 01: Data Model](./01-DATA-MODEL-FOUNDATION.md), [Module 05: Security](./05-SECURITY-AND-ACCESS-CONTROL.md)
> **Required By:** [Module 09-16: All feature modules]
> **Integrates With:** [Module 02: Dynamic Schema](./02-DYNAMIC-SCHEMA-ENGINE.md), [Module 04: Workflow](./04-WORKFLOW-ENGINE.md), [Module 06: Infrastructure](./06-INFRASTRUCTURE-AND-DEVOPS.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Key Personas](#13-key-personas)
   - 1.4 [Design Principles](#14-design-principles)
2. [Architecture](#2-architecture)
   - 2.1 [API Gateway Architecture](#21-api-gateway-architecture)
   - 2.2 [Request/Response Middleware Pipeline](#22-requestresponse-middleware-pipeline)
   - 2.3 [Versioning Strategy](#23-versioning-strategy)
   - 2.4 [Middleware Stack](#24-middleware-stack)
   - 2.5 [SSE Connection Management](#25-sse-connection-management)
   - 2.6 [Internal Event Bus Architecture](#26-internal-event-bus-architecture)
3. [Data Model](#3-data-model)
   - 3.1 [ApiKey Model](#31-apikey-model)
   - 3.2 [WebhookSubscription Model](#32-webhooksubscription-model)
   - 3.3 [WebhookDelivery Model](#33-webhookdelivery-model)
   - 3.4 [SSEConnection Model](#34-sseconnection-model)
   - 3.5 [Notification Model](#35-notification-model)
   - 3.6 [Enumerations](#36-enumerations)
   - 3.7 [ER Diagram](#37-er-diagram)
   - 3.8 [Index Catalog](#38-index-catalog)
4. [API Specification](#4-api-specification)
   - 4.1 [Events API](#41-events-api)
   - 4.2 [Participants API](#42-participants-api)
   - 4.3 [Workflows API](#43-workflows-api)
   - 4.4 [Fields API](#44-fields-api)
   - 4.5 [Custom Objects API](#45-custom-objects-api)
   - 4.6 [Delegations API](#46-delegations-api)
   - 4.7 [Check-in API](#47-check-in-api)
   - 4.8 [Analytics API](#48-analytics-api)
   - 4.9 [Webhooks API](#49-webhooks-api)
   - 4.10 [API Keys API](#410-api-keys-api)
   - 4.11 [Rate Limiting Tiers](#411-rate-limiting-tiers)
5. [Business Logic](#5-business-logic)
   - 5.1 [Source Implementation: SSE Loader](#51-source-implementation-sse-loader)
   - 5.2 [Source Implementation: Optimistic Locking](#52-source-implementation-optimistic-locking)
   - 5.3 [Source Implementation: Notification Creation](#53-source-implementation-notification-creation)
   - 5.4 [Source Implementation: REST API Routes](#54-source-implementation-rest-api-routes)
   - 5.5 [Source Implementation: Webhook Events](#55-source-implementation-webhook-events)
   - 5.6 [Source Implementation: Response Format](#56-source-implementation-response-format)
   - 5.7 [API Key Lifecycle](#57-api-key-lifecycle)
   - 5.8 [Webhook Delivery Engine](#58-webhook-delivery-engine)
   - 5.9 [SSE Scaling Strategy](#59-sse-scaling-strategy)
   - 5.10 [Optimistic Locking Implementation](#510-optimistic-locking-implementation)
   - 5.11 [Internal Event Bus](#511-internal-event-bus)
   - 5.12 [Request Validation Middleware](#512-request-validation-middleware)
   - 5.13 [Response Serialization](#513-response-serialization)
   - 5.14 [Pagination Strategies](#514-pagination-strategies)
   - 5.15 [Bulk Operations API Pattern](#515-bulk-operations-api-pattern)
   - 5.16 [Error Handling](#516-error-handling)
6. [User Interface](#6-user-interface)
   - 6.1 [API Key Management Dashboard](#61-api-key-management-dashboard)
   - 6.2 [Webhook Management Console](#62-webhook-management-console)
   - 6.3 [SSE Connection Monitor](#63-sse-connection-monitor)
   - 6.4 [API Usage Analytics Dashboard](#64-api-usage-analytics-dashboard)
7. [Integration Points](#7-integration-points)
   - 7.1 [Internal Event Catalog](#71-internal-event-catalog)
   - 7.2 [Webhook Event Catalog with Payloads](#72-webhook-event-catalog-with-payloads)
   - 7.3 [SSE Channel Catalog](#73-sse-channel-catalog)
8. [Configuration](#8-configuration)
   - 8.1 [API Rate Limits](#81-api-rate-limits)
   - 8.2 [Webhook Retry Policies](#82-webhook-retry-policies)
   - 8.3 [SSE Configuration](#83-sse-configuration)
   - 8.4 [API Versioning Settings](#84-api-versioning-settings)
   - 8.5 [CORS Configuration](#85-cors-configuration)
   - 8.6 [Request and Response Limits](#86-request-and-response-limits)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [API Contract Tests](#91-api-contract-tests)
   - 9.2 [Webhook Delivery Tests](#92-webhook-delivery-tests)
   - 9.3 [SSE Reconnection Tests](#93-sse-reconnection-tests)
   - 9.4 [Rate Limiting Tests](#94-rate-limiting-tests)
   - 9.5 [Load Tests](#95-load-tests)
10. [Security Considerations](#10-security-considerations)
    - 10.1 [API Key Security](#101-api-key-security)
    - 10.2 [Webhook Signature Verification](#102-webhook-signature-verification)
    - 10.3 [CORS Policy](#103-cors-policy)
    - 10.4 [Request Signing](#104-request-signing)
    - 10.5 [IP Allowlisting](#105-ip-allowlisting)
    - 10.6 [Audit Logging](#106-audit-logging)
    - 10.7 [Input Sanitization](#107-input-sanitization)
11. [Performance Requirements](#11-performance-requirements)
    - 11.1 [API Response Time Targets](#111-api-response-time-targets)
    - 11.2 [SSE Connection Limits](#112-sse-connection-limits)
    - 11.3 [Webhook Throughput](#113-webhook-throughput)
    - 11.4 [API Key Validation Caching](#114-api-key-validation-caching)
    - 11.5 [Response Compression](#115-response-compression)
12. [Open Questions & Decisions](#12-open-questions--decisions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)
  - C. [Complete Webhook Event Catalog](#c-complete-webhook-event-catalog)
  - D. [Error Code Catalog](#d-error-code-catalog)

---

## 1. Overview

### 1.1 Purpose

The API and Integration Layer serves as the **unified gateway** connecting the multi-tenant accreditation platform with external systems, frontend clients, and internal services. It provides three fundamental capabilities:

1. **External Integration Gateway** -- A RESTful API enabling third-party systems (registration portals, government databases, credential verification services) to programmatically interact with the platform. External integrators can register participants, query statuses, receive real-time notifications via webhooks, and build custom workflows on top of the accreditation engine.

2. **Real-Time Communication Layer** -- Server-Sent Events (SSE) channels that push live updates to frontend clients, including validator queue counts, participant status changes, badge print notifications, and SLA breach alerts. This eliminates polling and provides sub-second feedback for time-sensitive operations.

3. **Internal Event Bus** -- A typed domain event system that decouples modules, enabling asynchronous reactions to state changes across the platform. When a participant is approved in the workflow engine, the event bus notifies the badge generator, the notification system, the analytics collector, and any registered webhook subscribers -- all without direct module coupling.

### 1.2 Scope

This module covers the following subsystems:

| Subsystem                    | Description                                                         |
| ---------------------------- | ------------------------------------------------------------------- |
| **REST API**                 | Versioned RESTful endpoints for all platform resources (`/api/v1/`) |
| **Server-Sent Events (SSE)** | Real-time push channels for frontend clients                        |
| **Webhooks**                 | Outbound event notifications to external HTTP endpoints             |
| **Internal Events**          | Typed domain event bus for inter-module communication               |
| **Optimistic Locking**       | Concurrency control for multi-user resource mutations               |
| **API Key Management**       | Tenant-scoped authentication for external consumers                 |
| **Request Pipeline**         | Middleware stack for auth, validation, rate limiting, serialization |

**Out of scope:** GraphQL API (see Open Questions), gRPC internal communication, message queue infrastructure (future migration path from EventEmitter).

### 1.3 Key Personas

| Persona                    | Role                                               | Interaction with This Module                                                                                                                        |
| -------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **External Integrator**    | Third-party developer building on the platform API | Consumes REST API with API key authentication; receives webhook notifications; builds custom registration flows                                     |
| **Frontend Developer**     | Internal developer building platform UI            | Consumes REST endpoints via Remix loaders/actions; subscribes to SSE channels for real-time updates; implements optimistic UI with version checking |
| **Platform Administrator** | Manages tenant API access and integrations         | Creates/rotates API keys; configures webhook subscriptions; monitors API usage and rate limits; manages CORS policies                               |
| **Tenant Administrator**   | Configures integrations for their organization     | Sets up webhook endpoints for their systems; generates API keys for their external tools; reviews API usage dashboards                              |
| **DevOps Engineer**        | Maintains API infrastructure                       | Monitors SSE connection pools; tunes rate limits; manages API versioning deployments; reviews error rates and latency                               |

### 1.4 Design Principles

1. **Tenant Isolation by Default** -- Every API request is scoped to a tenant. API keys are tenant-bound. SSE channels deliver only tenant-relevant data. Webhook subscriptions fire only for tenant events.

2. **Fail Loud, Recover Gracefully** -- API errors return structured, actionable responses. Webhook deliveries retry with exponential backoff. SSE connections auto-reconnect with event replay.

3. **Consistency Over Convenience** -- All endpoints follow identical patterns for pagination, error responses, field selection, and relation expansion. One pattern learned is every pattern known.

4. **Security as a First-Class Concern** -- API keys are hashed at rest. Webhook payloads are HMAC-signed. All mutations are audit-logged. Rate limits protect against abuse.

5. **Observable by Design** -- Every API call, webhook delivery, and SSE connection is instrumented with metrics, traces, and structured logs.

---

## 2. Architecture

### 2.1 API Gateway Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        External Clients                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Third-Party  │  │   Mobile     │  │   Partner Systems        │  │
│  │ Integrators  │  │   Apps       │  │   (Gov DBs, CRM, etc.)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
└─────────┼──────────────────┼──────────────────────┼────────────────┘
          │                  │                      │
          ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Load Balancer / CDN                         │  │
│  │              (Cloudflare / AWS ALB / Nginx)                   │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────▼───────────────────────────────────┐  │
│  │                  Remix Server (Node.js)                        │  │
│  │                                                               │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │  │
│  │  │  REST   │  │   SSE    │  │ Webhook  │  │   Internal   │  │  │
│  │  │  API    │  │ Channels │  │ Dispatch │  │  Event Bus   │  │  │
│  │  │ Routes  │  │ Manager  │  │  Engine  │  │  (EventEmit) │  │  │
│  │  └────┬────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │  │
│  │       │            │             │                │           │  │
│  │       ▼            ▼             ▼                ▼           │  │
│  │  ┌───────────────────────────────────────────────────────┐   │  │
│  │  │              Middleware Pipeline                        │   │  │
│  │  │  Auth → Rate Limit → Tenant → Validate → Serialize    │   │  │
│  │  └───────────────────────────┬───────────────────────────┘   │  │
│  │                              │                               │  │
│  └──────────────────────────────┼───────────────────────────────┘  │
│                                 │                                   │
│  ┌──────────────────────────────▼───────────────────────────────┐  │
│  │                    Service Layer                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │  Event   │  │Participant│  │ Workflow │  │   Badge     │  │  │
│  │  │ Service  │  │ Service  │  │ Service  │  │  Service    │  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │  │
│  │       └──────────────┴─────────────┴───────────────┘         │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │                                   │
│  ┌──────────────────────────────▼───────────────────────────────┐  │
│  │              Prisma ORM / PostgreSQL                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Request/Response Middleware Pipeline

Every API request passes through a deterministic middleware pipeline. Each middleware is a pure function that transforms the request context or short-circuits with an error response.

```
Request ──►┌──────────────┐    ┌──────────────┐    ┌──────────────┐
           │  API Key      │───►│  Rate Limit  │───►│   Tenant     │
           │  Auth         │    │  Check       │    │   Scope      │
           └──────────────┘    └──────────────┘    └──────────────┘
                                                          │
                                                          ▼
Response◄──┌──────────────┐    ┌──────────────┐    ┌──────────────┐
           │  Response     │◄───│   Handler    │◄───│  Request     │
           │  Serializer   │    │  (Business)  │    │  Validator   │
           └──────────────┘    └──────────────┘    └──────────────┘
```

**Pipeline stages:**

| Stage                      | Responsibility                                                            | Failure Response                                  |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| **1. API Key Auth**        | Extract `X-API-Key` header, validate against hashed store, resolve tenant | `401 Unauthorized`                                |
| **2. Rate Limit**          | Check request count against tier limits (sliding window)                  | `429 Too Many Requests` with `Retry-After` header |
| **3. Tenant Scope**        | Inject `tenantId` into request context, enforce row-level isolation       | `403 Forbidden` (cross-tenant access)             |
| **4. Request Validation**  | Validate body/params/query against Zod schemas                            | `400 Bad Request` with field-level errors         |
| **5. Handler**             | Execute business logic, interact with services and database               | `4xx`/`5xx` depending on error type               |
| **6. Response Serializer** | Apply field selection, relation expansion, envelope format, HATEOAS links | N/A (post-processing)                             |

### 2.3 Versioning Strategy

The platform uses **URL path versioning** to provide clear, explicit API version targeting:

```
/api/v1/events                    # Current stable version
/api/v2/events                    # Next version (when applicable)
```

**Versioning rules:**

- Breaking changes (field removals, type changes, semantic changes) require a new version.
- Additive changes (new fields, new endpoints) are added to the current version.
- Deprecated versions receive security patches only for 12 months after successor release.
- Each API version maps to a dedicated route module in Remix (`app/routes/api.v1+/`).
- Version header `X-API-Version` returned in all responses for client awareness.

```typescript
// app/routes/api.v1+/_layout.tsx
import { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";

export function loader({ request }: LoaderFunctionArgs) {
  // All v1 routes inherit this layout
  const version = "v1";
  return new Response(null, {
    headers: {
      "X-API-Version": version,
      "X-Deprecation": "false",
    },
  });
}
```

### 2.4 Middleware Stack

```typescript
// app/middleware/api-pipeline.ts
import { compose } from "~/utils/middleware";

export const apiPipeline = compose(
  corsMiddleware, // CORS headers
  requestIdMiddleware, // X-Request-Id generation
  apiKeyAuthMiddleware, // API key validation
  rateLimitMiddleware, // Rate limit enforcement
  tenantScopeMiddleware, // Tenant context injection
  requestLogMiddleware, // Structured request logging
  validationMiddleware, // Zod schema validation
  // --- Handler executes here ---
  serializationMiddleware, // Response envelope formatting
  compressionMiddleware, // gzip/brotli compression
  auditLogMiddleware, // Mutation audit trail
);

// Middleware composition utility
type Middleware = (
  request: Request,
  context: ApiContext,
  next: () => Promise<Response>,
) => Promise<Response>;

function compose(...middlewares: Middleware[]): Middleware {
  return (request, context, handler) => {
    let index = -1;

    function dispatch(i: number): Promise<Response> {
      if (i <= index) {
        return Promise.reject(new Error("next() called multiple times"));
      }
      index = i;

      const fn = i === middlewares.length ? handler : middlewares[i];
      if (!fn) return Promise.resolve(new Response(null, { status: 404 }));

      return fn(request, context, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}

// API context carried through the pipeline
interface ApiContext {
  requestId: string;
  tenantId: string;
  apiKeyId: string;
  permissions: string[];
  scopes: string[];
  rateLimitTier: RateLimitTier;
  startTime: number;
  version: string;
}
```

### 2.5 SSE Connection Management

```
┌──────────────────────────────────────────────────────────┐
│                  SSE Connection Manager                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Connection Registry                    │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Map<userId, Set<SSEConnection>>             │  │  │
│  │  │                                              │  │  │
│  │  │  user-001 → [conn-a, conn-b]                 │  │  │
│  │  │  user-002 → [conn-c]                         │  │  │
│  │  │  user-003 → [conn-d, conn-e, conn-f]         │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────┐  ┌──────────────────────────┐     │
│  │  Heartbeat Timer  │  │  Connection Reaper       │     │
│  │  (every 30s)      │  │  (stale > 5min)          │     │
│  └───────────────────┘  └──────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Channel Subscriptions                  │  │
│  │                                                    │  │
│  │  Channel: "validator-queue"                        │  │
│  │    Subscribers: [conn-a, conn-d]                   │  │
│  │                                                    │  │
│  │  Channel: "participant-status:{eventId}"           │  │
│  │    Subscribers: [conn-b, conn-c, conn-e]           │  │
│  │                                                    │  │
│  │  Channel: "notifications:{userId}"                 │  │
│  │    Subscribers: [conn-f]                           │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 2.6 Internal Event Bus Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Internal Event Bus                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  TypedEventEmitter                         │   │
│  │                                                           │   │
│  │  Publishers:                                              │   │
│  │    WorkflowEngine  ──emit──►  ParticipantApproved         │   │
│  │    Registration     ──emit──►  ParticipantRegistered      │   │
│  │    BadgeService    ──emit──►  BadgePrinted                │   │
│  │    CheckInService  ──emit──►  BadgeCollected              │   │
│  │                                                           │   │
│  │  Middleware:                                               │   │
│  │    ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │   │
│  │    │  Logger  │→ │ Metrics  │→ │  Error Handler       │  │   │
│  │    └──────────┘  └──────────┘  └──────────────────────┘  │   │
│  │                                                           │   │
│  │  Subscribers:                                             │   │
│  │    NotificationService  ◄──listen──  ParticipantApproved  │   │
│  │    WebhookDispatcher    ◄──listen──  * (all events)       │   │
│  │    AnalyticsCollector   ◄──listen──  * (all events)       │   │
│  │    SSEBroadcaster       ◄──listen──  * (all events)       │   │
│  │    AuditLogger          ◄──listen──  * (mutations)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Future: Message Queue Migration               │   │
│  │                                                           │   │
│  │  EventEmitter ──adapter──► BullMQ / RabbitMQ / SQS       │   │
│  │                                                           │   │
│  │  Same event types, same subscriber interface.             │   │
│  │  Transport becomes durable and distributed.               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### 3.1 ApiKey Model

```prisma
model ApiKey {
  id            String        @id @default(cuid())
  tenantId      String
  tenant        Tenant        @relation(fields: [tenantId], references: [id])

  name          String                          // Human-readable label
  description   String?                         // Purpose documentation
  keyHash       String        @unique           // bcrypt hash of the API key
  keyPrefix     String                          // First 8 chars for identification (e.g., "ak_live_")
  permissions   String[]                        // ["events:read", "participants:write", ...]
  scopes        Json?                           // Resource-specific scoping: { eventIds: [...] }

  rateLimitTier RateLimitTier @default(STANDARD)
  rateLimitCustom Int?                          // Custom requests/min (overrides tier)

  status        ApiKeyStatus  @default(ACTIVE)
  expiresAt     DateTime?                       // Optional expiry
  lastUsedAt    DateTime?                       // Usage tracking
  lastUsedIp    String?                         // Last request IP
  usageCount    Int           @default(0)       // Total request count

  allowedIps    String[]                        // IP allowlist (empty = all)
  allowedOrigins String[]                       // CORS origins for this key

  rotatedFromId String?                         // Previous key (rotation chain)
  rotatedFrom   ApiKey?       @relation("KeyRotation", fields: [rotatedFromId], references: [id])
  rotatedTo     ApiKey?       @relation("KeyRotation")
  rotationGraceEnd DateTime?                    // Grace period for old key after rotation

  createdBy     String
  createdByUser User          @relation(fields: [createdBy], references: [id])
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  revokedAt     DateTime?

  deliveries    WebhookDelivery[]

  @@index([tenantId, status])
  @@index([keyHash])
  @@index([keyPrefix])
  @@index([tenantId, lastUsedAt])
  @@map("api_keys")
}
```

### 3.2 WebhookSubscription Model

```prisma
model WebhookSubscription {
  id          String              @id @default(cuid())
  tenantId    String
  tenant      Tenant              @relation(fields: [tenantId], references: [id])

  url         String                              // Target endpoint URL
  description String?                             // Human-readable description
  events      String[]                            // Event types: ["participant.registered", ...]
  secret      String                              // HMAC-SHA256 signing secret (encrypted at rest)

  status      WebhookStatus       @default(ACTIVE)
  version     String              @default("v1")  // Payload version

  // Retry configuration
  maxRetries        Int           @default(5)
  retryBackoffMs    Int[]         @default([1000, 5000, 30000, 300000, 1800000])
  timeoutMs         Int           @default(10000) // Request timeout

  // Circuit breaker state
  consecutiveFailures Int         @default(0)
  circuitBreakerOpen  Boolean     @default(false)
  circuitBreakerResetAt DateTime?

  // Metadata
  headers     Json?                               // Custom headers to include
  metadata    Json?                               // Arbitrary metadata

  createdBy   String
  createdByUser User              @relation(fields: [createdBy], references: [id])
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  deliveries  WebhookDelivery[]

  @@index([tenantId, status])
  @@index([tenantId, events])
  @@map("webhook_subscriptions")
}
```

### 3.3 WebhookDelivery Model

```prisma
model WebhookDelivery {
  id              String            @id @default(cuid())
  tenantId        String
  subscriptionId  String
  subscription    WebhookSubscription @relation(fields: [subscriptionId], references: [id])

  eventType       String                          // e.g., "participant.registered"
  eventId         String                          // Unique event ID for idempotency
  payload         Json                            // Full event payload

  // Delivery tracking
  status          DeliveryStatus    @default(PENDING)
  attempts        Int               @default(0)
  maxAttempts     Int               @default(5)
  nextRetryAt     DateTime?

  // Response tracking
  responseCode    Int?                            // HTTP status code
  responseBody    String?                         // Truncated response body
  responseHeaders Json?                           // Response headers
  latencyMs       Int?                            // Round-trip time

  // Error tracking
  errorMessage    String?
  errorType       String?                         // TIMEOUT, CONNECTION_REFUSED, HTTP_ERROR, etc.

  deliveredAt     DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([subscriptionId, status])
  @@index([tenantId, eventType, createdAt])
  @@index([status, nextRetryAt])                  // For retry queue polling
  @@index([eventId])                              // For idempotency checks
  @@map("webhook_deliveries")
}
```

### 3.4 SSEConnection Model

```prisma
model SSEConnection {
  id            String        @id @default(cuid())
  tenantId      String
  userId        String
  user          User          @relation(fields: [userId], references: [id])

  channels      String[]                          // Subscribed channels
  userAgent     String?
  ipAddress     String?
  lastEventId   String?                           // For reconnection replay
  lastHeartbeat DateTime      @default(now())

  status        ConnectionStatus @default(ACTIVE)
  connectedAt   DateTime      @default(now())
  disconnectedAt DateTime?

  // Server instance tracking (for multi-instance deployments)
  serverInstance String                           // Hostname/pod identifier

  @@index([tenantId, userId, status])
  @@index([status, lastHeartbeat])                // For connection reaping
  @@index([serverInstance, status])               // For graceful shutdown
  @@map("sse_connections")
}
```

### 3.5 Notification Model

```prisma
model Notification {
  id          String            @id @default(cuid())
  tenantId    String
  tenant      Tenant            @relation(fields: [tenantId], references: [id])
  userId      String
  user        User              @relation(fields: [userId], references: [id])

  type        NotificationType
  title       String
  body        String
  metadata    Json?                               // { participantId, eventId, ... }

  read        Boolean           @default(false)
  readAt      DateTime?
  dismissed   Boolean           @default(false)

  // Delivery tracking
  deliveredViaSSE Boolean       @default(false)
  deliveredViaEmail Boolean     @default(false)

  expiresAt   DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([tenantId, userId, read, createdAt])
  @@index([userId, read])
  @@index([tenantId, type, createdAt])
  @@map("notifications")
}
```

### 3.6 Enumerations

```prisma
enum ApiKeyStatus {
  ACTIVE
  ROTATED           // Replaced by new key, in grace period
  REVOKED
  EXPIRED
}

enum RateLimitTier {
  STANDARD          // 100 req/min
  ELEVATED          // 500 req/min
  PREMIUM           // 2000 req/min
  CUSTOM            // Uses rateLimitCustom field
}

enum WebhookStatus {
  ACTIVE
  PAUSED            // Manually paused by user
  DISABLED          // Circuit breaker tripped
  SUSPENDED         // Admin suspended
}

enum DeliveryStatus {
  PENDING
  DELIVERED
  FAILED
  RETRYING
  DEAD_LETTER       // Exhausted retries
}

enum ConnectionStatus {
  ACTIVE
  DISCONNECTED
  DRAINING          // Server shutting down
}

enum NotificationType {
  APPROVAL          // Registration approved
  REJECTION         // Registration rejected
  STATUS_CHANGE     // Generic status change
  SLA_WARNING       // SLA approaching breach
  SLA_BREACH        // SLA breached
  ASSIGNMENT        // Work assigned to user
  BADGE_READY       // Badge ready for collection
  SYSTEM            // System notification
}
```

### 3.7 ER Diagram

```
┌─────────────┐       ┌──────────────────────┐       ┌──────────────────┐
│   Tenant    │───1:N─│       ApiKey          │       │      User        │
│             │       │                      │───N:1─│                  │
│  id         │       │  id                  │       │  id              │
│  name       │       │  tenantId      (FK)  │       │  name            │
│  slug       │       │  keyHash             │       │  email           │
└──────┬──────┘       │  permissions[]       │       └────────┬─────────┘
       │              │  scopes              │                │
       │              │  rateLimitTier       │                │
       │              │  status              │                │
       │              │  createdBy     (FK)  │                │
       │              └──────────────────────┘                │
       │                                                      │
       │              ┌──────────────────────┐                │
       ├───1:N────────│ WebhookSubscription  │                │
       │              │                      │───N:1──────────┤
       │              │  id                  │                │
       │              │  tenantId      (FK)  │                │
       │              │  url                 │                │
       │              │  events[]            │                │
       │              │  secret              │                │
       │              │  status              │                │
       │              │  createdBy     (FK)  │                │
       │              └──────────┬───────────┘                │
       │                         │                            │
       │                         │ 1:N                        │
       │                         ▼                            │
       │              ┌──────────────────────┐                │
       │              │  WebhookDelivery     │                │
       │              │                      │                │
       │              │  id                  │                │
       │              │  subscriptionId (FK) │                │
       │              │  eventType           │                │
       │              │  payload             │                │
       │              │  status              │                │
       │              │  attempts            │                │
       │              │  responseCode        │                │
       │              └──────────────────────┘                │
       │                                                      │
       │              ┌──────────────────────┐                │
       ├───1:N────────│   SSEConnection      │────N:1─────────┤
       │              │                      │                │
       │              │  id                  │                │
       │              │  tenantId      (FK)  │                │
       │              │  userId        (FK)  │                │
       │              │  channels[]          │                │
       │              │  status              │                │
       │              └──────────────────────┘                │
       │                                                      │
       │              ┌──────────────────────┐                │
       └───1:N────────│    Notification      │────N:1─────────┘
                      │                      │
                      │  id                  │
                      │  tenantId      (FK)  │
                      │  userId        (FK)  │
                      │  type                │
                      │  title               │
                      │  body                │
                      │  read                │
                      └──────────────────────┘
```

### 3.8 Index Catalog

| Table                   | Index                         | Columns                               | Purpose                           |
| ----------------------- | ----------------------------- | ------------------------------------- | --------------------------------- |
| `api_keys`              | `idx_api_keys_tenant_status`  | `(tenantId, status)`                  | Filter active keys by tenant      |
| `api_keys`              | `idx_api_keys_hash`           | `(keyHash)`                           | Unique key lookup during auth     |
| `api_keys`              | `idx_api_keys_prefix`         | `(keyPrefix)`                         | Key identification in logs        |
| `api_keys`              | `idx_api_keys_tenant_usage`   | `(tenantId, lastUsedAt)`              | Usage analytics                   |
| `webhook_subscriptions` | `idx_webhooks_tenant_status`  | `(tenantId, status)`                  | Active subscriptions per tenant   |
| `webhook_subscriptions` | `idx_webhooks_tenant_events`  | `(tenantId, events)`                  | Event-type filtering              |
| `webhook_deliveries`    | `idx_deliveries_sub_status`   | `(subscriptionId, status)`            | Delivery history per subscription |
| `webhook_deliveries`    | `idx_deliveries_tenant_event` | `(tenantId, eventType, createdAt)`    | Event delivery audit              |
| `webhook_deliveries`    | `idx_deliveries_retry_queue`  | `(status, nextRetryAt)`               | Retry queue polling               |
| `webhook_deliveries`    | `idx_deliveries_idempotency`  | `(eventId)`                           | Idempotency deduplication         |
| `sse_connections`       | `idx_sse_tenant_user`         | `(tenantId, userId, status)`          | User connection lookup            |
| `sse_connections`       | `idx_sse_heartbeat`           | `(status, lastHeartbeat)`             | Stale connection reaping          |
| `sse_connections`       | `idx_sse_server`              | `(serverInstance, status)`            | Graceful shutdown queries         |
| `notifications`         | `idx_notif_user_unread`       | `(tenantId, userId, read, createdAt)` | Unread notification feed          |
| `notifications`         | `idx_notif_user_read`         | `(userId, read)`                      | Quick unread count                |
| `notifications`         | `idx_notif_type`              | `(tenantId, type, createdAt)`         | Type-based filtering              |

---

## 4. API Specification

All endpoints are prefixed with `/api/v1` and require the `X-API-Key` header unless otherwise noted. Responses follow the standard envelope format defined in [Section 5.13](#513-response-serialization).

### 4.1 Events API

#### `GET /api/v1/events`

List events accessible to the authenticated API key.

```
Permission: events:read
Rate Limit: General (100/min)

Query Parameters:
  ?status=ACTIVE|DRAFT|COMPLETED|ARCHIVED    Filter by status
  ?search=string                             Full-text search on name/description
  ?startDate=ISO8601                         Events starting after date
  ?endDate=ISO8601                           Events ending before date
  ?page=number                               Page number (default: 1)
  ?pageSize=number                           Items per page (default: 20, max: 100)
  ?sort=name|startDate|createdAt             Sort field (default: startDate)
  ?order=asc|desc                            Sort direction (default: desc)
  ?fields=id,name,startDate                  Field selection
  ?include=venue,stats                       Relation expansion

Response 200:
{
  "data": [
    {
      "id": "evt_abc123",
      "name": "Annual Conference 2026",
      "description": "International accreditation event",
      "status": "ACTIVE",
      "startDate": "2026-03-15T09:00:00Z",
      "endDate": "2026-03-17T18:00:00Z",
      "venue": { ... },                      // if ?include=venue
      "stats": { "total": 500, ... },        // if ?include=stats
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-02-10T12:00:00Z",
      "_links": {
        "self": "/api/v1/events/evt_abc123",
        "participants": "/api/v1/events/evt_abc123/participants"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}

Error Responses:
  401 Unauthorized     - Missing or invalid API key
  403 Forbidden        - Key lacks events:read permission
  429 Too Many Requests - Rate limit exceeded
```

#### `GET /api/v1/events/:eventId`

Get a single event by ID.

```
Permission: events:read
Rate Limit: General (100/min)

Path Parameters:
  eventId: string (required)

Query Parameters:
  ?fields=id,name,startDate                  Field selection
  ?include=venue,stats,customFields          Relation expansion

Response 200:
{
  "data": {
    "id": "evt_abc123",
    "name": "Annual Conference 2026",
    "description": "International accreditation event",
    "status": "ACTIVE",
    "startDate": "2026-03-15T09:00:00Z",
    "endDate": "2026-03-17T18:00:00Z",
    "maxParticipants": 1000,
    "registrationDeadline": "2026-03-01T23:59:59Z",
    "customFields": [ ... ],
    "venue": { ... },
    "stats": {
      "totalRegistered": 500,
      "totalApproved": 350,
      "totalRejected": 25,
      "totalPending": 125
    },
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-02-10T12:00:00Z",
    "_links": {
      "self": "/api/v1/events/evt_abc123",
      "participants": "/api/v1/events/evt_abc123/participants",
      "stats": "/api/v1/events/evt_abc123/stats"
    }
  }
}

Error Responses:
  401 Unauthorized     - Missing or invalid API key
  403 Forbidden        - Key lacks events:read or event not in scope
  404 Not Found        - Event not found in tenant
```

#### `POST /api/v1/events`

Create a new event.

```
Permission: events:write
Rate Limit: Mutations (50/min)

Request Body:
{
  "name": "Annual Conference 2026",           // required, 1-200 chars
  "description": "Description text",          // optional, max 5000 chars
  "startDate": "2026-03-15T09:00:00Z",       // required, ISO 8601
  "endDate": "2026-03-17T18:00:00Z",         // required, after startDate
  "maxParticipants": 1000,                    // optional, positive integer
  "registrationDeadline": "2026-03-01T23:59:59Z", // optional
  "venueId": "ven_xyz789",                    // optional
  "metadata": { ... }                         // optional, arbitrary JSON
}

Response 201:
{
  "data": {
    "id": "evt_new123",
    ...event fields...
    "_links": {
      "self": "/api/v1/events/evt_new123"
    }
  }
}

Error Responses:
  400 Bad Request      - Validation errors (field-level details)
  401 Unauthorized     - Missing or invalid API key
  403 Forbidden        - Key lacks events:write permission
  409 Conflict         - Duplicate event name in tenant
  429 Too Many Requests - Rate limit exceeded
```

#### `PUT /api/v1/events/:eventId`

Update an existing event.

```
Permission: events:write
Rate Limit: Mutations (50/min)

Headers:
  If-Match: "version-timestamp"              // Optimistic locking

Request Body:
{
  "name": "Updated Conference Name",
  "description": "Updated description",
  "endDate": "2026-03-18T18:00:00Z"
}

Response 200:
{
  "data": { ...updated event... }
}

Error Responses:
  400 Bad Request      - Validation errors
  401 Unauthorized     - Missing or invalid API key
  403 Forbidden        - Key lacks events:write or event not in scope
  404 Not Found        - Event not found in tenant
  409 Conflict         - Version mismatch (concurrent modification)
  429 Too Many Requests - Rate limit exceeded
```

#### `DELETE /api/v1/events/:eventId`

Soft-delete an event (sets status to ARCHIVED).

```
Permission: events:delete
Rate Limit: Mutations (50/min)

Response 204: No Content

Error Responses:
  401 Unauthorized     - Missing or invalid API key
  403 Forbidden        - Key lacks events:delete permission
  404 Not Found        - Event not found in tenant
  409 Conflict         - Event has active participants
```

### 4.2 Participants API

#### `GET /api/v1/events/:eventId/participants`

List participants for an event.

```
Permission: participants:read
Rate Limit: General (100/min)

Query Parameters:
  ?status=REGISTERED|PENDING|APPROVED|REJECTED|PRINTED|COLLECTED
  ?search=string                             Search name/email/org
  ?customField.{fieldSlug}=value             Filter by custom field value
  ?registeredAfter=ISO8601                   Registration date filter
  ?registeredBefore=ISO8601
  ?page=number
  ?pageSize=number                           (default: 20, max: 100)
  ?sort=name|registeredAt|status
  ?order=asc|desc
  ?fields=id,name,email,status
  ?include=customFieldValues,workflowStatus,badges

Response 200:
{
  "data": [
    {
      "id": "prt_abc123",
      "eventId": "evt_abc123",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "organization": "Acme Corp",
      "status": "APPROVED",
      "registeredAt": "2026-02-01T10:00:00Z",
      "customFieldValues": {
        "passport_number": "AB1234567",
        "dietary_requirements": "vegetarian"
      },
      "workflowStatus": {
        "currentStep": "badge-printing",
        "completedSteps": ["document-review", "manager-approval"]
      },
      "_links": {
        "self": "/api/v1/events/evt_abc123/participants/prt_abc123",
        "approve": "/api/v1/events/evt_abc123/participants/prt_abc123/approve",
        "reject": "/api/v1/events/evt_abc123/participants/prt_abc123/reject"
      }
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 500, "totalPages": 25 }
}
```

#### `GET /api/v1/events/:eventId/participants/:id`

Get a single participant.

```
Permission: participants:read
Rate Limit: General (100/min)

Query Parameters:
  ?fields=...
  ?include=customFieldValues,workflowStatus,badges,auditLog

Response 200:
{
  "data": {
    "id": "prt_abc123",
    ...full participant details...
    "auditLog": [
      {
        "action": "STATUS_CHANGE",
        "from": "PENDING",
        "to": "APPROVED",
        "performedBy": "user_xyz",
        "timestamp": "2026-02-05T14:30:00Z"
      }
    ]
  }
}
```

#### `POST /api/v1/events/:eventId/participants`

Register a new participant.

```
Permission: participants:write
Rate Limit: Mutations (50/min)

Request Body:
{
  "firstName": "Jane",                        // required
  "lastName": "Smith",                        // required
  "email": "jane@example.com",               // required, valid email
  "organization": "Acme Corp",               // optional
  "phone": "+1234567890",                    // optional
  "customFields": {                          // validated against event schema
    "passport_number": "AB1234567",
    "dietary_requirements": "vegetarian"
  },
  "metadata": { ... }                        // optional
}

Response 201:
{
  "data": {
    "id": "prt_new456",
    "status": "REGISTERED",
    ...participant fields...
  }
}

Error Responses:
  400 Bad Request      - Validation errors (including custom field validation)
  401 Unauthorized     - Missing or invalid API key
  403 Forbidden        - Key lacks participants:write permission
  404 Not Found        - Event not found
  409 Conflict         - Duplicate email for this event
  422 Unprocessable    - Registration closed or event full
```

#### `PUT /api/v1/events/:eventId/participants/:id`

Update participant information.

```
Permission: participants:write
Rate Limit: Mutations (50/min)

Headers:
  If-Match: "version-timestamp"

Request Body:
{
  "firstName": "Janet",
  "customFields": {
    "dietary_requirements": "vegan"
  }
}

Response 200:
{
  "data": { ...updated participant... }
}

Error Responses:
  400, 401, 403, 404, 409 (version mismatch), 429
```

#### `POST /api/v1/events/:eventId/participants/:id/approve`

Approve a participant.

```
Permission: participants:approve
Rate Limit: Mutations (50/min)

Headers:
  If-Match: "version-timestamp"

Request Body:
{
  "comment": "Documents verified successfully",  // optional
  "notifyParticipant": true                      // optional, default true
}

Response 200:
{
  "data": {
    "id": "prt_abc123",
    "status": "APPROVED",
    "approvedBy": "user_xyz",
    "approvedAt": "2026-02-05T14:30:00Z"
  }
}

Error Responses:
  400 Bad Request      - Cannot approve from current status
  401, 403, 404, 409 (version mismatch), 429
```

#### `POST /api/v1/events/:eventId/participants/:id/reject`

Reject a participant.

```
Permission: participants:reject
Rate Limit: Mutations (50/min)

Headers:
  If-Match: "version-timestamp"

Request Body:
{
  "reason": "Incomplete documentation",          // required
  "notifyParticipant": true                      // optional, default true
}

Response 200:
{
  "data": {
    "id": "prt_abc123",
    "status": "REJECTED",
    "rejectedBy": "user_xyz",
    "rejectedAt": "2026-02-05T15:00:00Z",
    "rejectionReason": "Incomplete documentation"
  }
}

Error Responses:
  400 Bad Request      - Missing reason or invalid state transition
  401, 403, 404, 409, 429
```

### 4.3 Workflows API

#### `POST /api/v1/events/:eventId/participants/:id/workflow/process`

Process the current workflow step for a participant.

```
Permission: workflow:execute
Rate Limit: Mutations (50/min)

Headers:
  If-Match: "version-timestamp"

Request Body:
{
  "action": "approve" | "reject" | "escalate" | "return",
  "comment": "Verified all documents",          // optional
  "data": { ... }                               // Step-specific data
}

Response 200:
{
  "data": {
    "participantId": "prt_abc123",
    "workflowInstanceId": "wfi_xyz",
    "previousStep": "document-review",
    "currentStep": "manager-approval",
    "status": "IN_PROGRESS",
    "completedSteps": [
      {
        "stepId": "document-review",
        "action": "approve",
        "performedBy": "user_xyz",
        "completedAt": "2026-02-05T14:30:00Z"
      }
    ]
  }
}
```

#### `POST /api/v1/events/:eventId/workflow/batch`

Process workflow steps for multiple participants in a single request.

```
Permission: workflow:execute
Rate Limit: Mutations (50/min)

Request Body:
{
  "operations": [
    {
      "participantId": "prt_abc123",
      "action": "approve",
      "version": "2026-02-05T14:00:00.000Z",
      "comment": "Batch approved"
    },
    {
      "participantId": "prt_def456",
      "action": "approve",
      "version": "2026-02-05T13:00:00.000Z"
    }
  ]
}

Response 200:
{
  "data": {
    "results": [
      { "participantId": "prt_abc123", "status": "success", "data": { ... } },
      { "participantId": "prt_def456", "status": "error", "error": {
          "code": "CONFLICT",
          "message": "Participant was modified by another user"
        }
      }
    ],
    "summary": { "total": 2, "succeeded": 1, "failed": 1 }
  }
}
```

### 4.4 Fields API

#### `GET /api/v1/events/:eventId/fields`

List custom field definitions for an event.

```
Permission: fields:read
Rate Limit: General (100/min)

Response 200:
{
  "data": [
    {
      "id": "cf_abc123",
      "slug": "passport_number",
      "label": "Passport Number",
      "type": "TEXT",
      "required": true,
      "validation": { "pattern": "^[A-Z]{2}[0-9]{7}$" },
      "order": 1,
      "section": "identity",
      "visibility": "INTERNAL"
    }
  ]
}
```

#### `POST /api/v1/events/:eventId/fields`

Create a custom field definition.

```
Permission: fields:write
Rate Limit: Mutations (50/min)

Request Body:
{
  "slug": "passport_number",                   // required, unique per event
  "label": "Passport Number",                  // required
  "type": "TEXT|NUMBER|DATE|SELECT|MULTISELECT|FILE|BOOLEAN",
  "required": true,
  "validation": {
    "pattern": "^[A-Z]{2}[0-9]{7}$",
    "minLength": 9,
    "maxLength": 9
  },
  "options": [...],                            // For SELECT/MULTISELECT
  "order": 1,
  "section": "identity",
  "visibility": "PUBLIC|INTERNAL|PRIVATE"
}

Response 201:
{
  "data": { ...created field definition... }
}
```

#### `PUT /api/v1/events/:eventId/fields/:fieldId`

Update a custom field definition.

```
Permission: fields:write
Rate Limit: Mutations (50/min)

Error Responses:
  409 Conflict - Field has existing data; destructive changes blocked
```

#### `DELETE /api/v1/events/:eventId/fields/:fieldId`

Delete a custom field definition.

```
Permission: fields:delete
Rate Limit: Mutations (50/min)

Error Responses:
  409 Conflict - Field has existing participant data
```

### 4.5 Custom Objects API

#### `GET /api/v1/custom-objects`

List custom object definitions.

```
Permission: custom-objects:read
Rate Limit: General (100/min)

Response 200:
{
  "data": [
    {
      "id": "co_abc123",
      "slug": "venue",
      "label": "Venue",
      "fields": [ ...field definitions... ],
      "recordCount": 15
    }
  ]
}
```

#### `POST /api/v1/custom-objects`

Create a custom object definition.

```
Permission: custom-objects:write
Rate Limit: Mutations (50/min)

Request Body:
{
  "slug": "venue",
  "label": "Venue",
  "description": "Event venues",
  "fields": [
    { "slug": "name", "label": "Name", "type": "TEXT", "required": true },
    { "slug": "capacity", "label": "Capacity", "type": "NUMBER" },
    { "slug": "address", "label": "Address", "type": "TEXT" }
  ]
}
```

#### `GET /api/v1/custom-objects/:objectSlug/records`

List records for a custom object.

```
Permission: custom-objects:read
Rate Limit: General (100/min)

Query Parameters:
  ?filter.{fieldSlug}=value
  ?page, ?pageSize, ?sort, ?order
```

#### `POST /api/v1/custom-objects/:objectSlug/records`

Create a record for a custom object.

```
Permission: custom-objects:write
Rate Limit: Mutations (50/min)

Request Body:
{
  "fields": {
    "name": "Convention Center A",
    "capacity": 5000,
    "address": "123 Main St"
  }
}
```

#### `PUT /api/v1/custom-objects/:objectSlug/records/:recordId`

Update a custom object record.

```
Permission: custom-objects:write
Rate Limit: Mutations (50/min)
```

#### `DELETE /api/v1/custom-objects/:objectSlug/records/:recordId`

Delete a custom object record.

```
Permission: custom-objects:delete
Rate Limit: Mutations (50/min)
```

### 4.6 Delegations API

#### `GET /api/v1/events/:eventId/delegations`

List delegations for an event.

```
Permission: delegations:read
Rate Limit: General (100/min)

Response 200:
{
  "data": [
    {
      "id": "del_abc123",
      "organization": "UN Mission",
      "quota": 50,
      "used": 35,
      "remaining": 15,
      "headOfDelegation": { "id": "user_xyz", "name": "John Doe" },
      "status": "ACTIVE"
    }
  ]
}
```

#### `GET /api/v1/events/:eventId/delegations/:delegationId/quota`

Get quota details for a delegation.

```
Permission: delegations:read
Rate Limit: General (100/min)

Response 200:
{
  "data": {
    "delegationId": "del_abc123",
    "totalQuota": 50,
    "usedQuota": 35,
    "remainingQuota": 15,
    "breakdown": {
      "registered": 10,
      "pending": 5,
      "approved": 18,
      "rejected": 2
    }
  }
}
```

#### `POST /api/v1/events/:eventId/delegations`

Create a new delegation.

```
Permission: delegations:write
Rate Limit: Mutations (50/min)

Request Body:
{
  "organization": "UN Mission",
  "quota": 50,
  "headOfDelegationUserId": "user_xyz",
  "metadata": { ... }
}
```

#### `PUT /api/v1/events/:eventId/delegations/:delegationId`

Update a delegation.

```
Permission: delegations:write
Rate Limit: Mutations (50/min)
```

### 4.7 Check-in API

#### `POST /api/v1/events/:eventId/check-in/scan`

Process a badge scan for check-in.

```
Permission: checkin:write
Rate Limit: Mutations (50/min)

Request Body:
{
  "badgeCode": "QR-CODE-DATA-STRING",          // required
  "checkpointId": "cp_entrance_main",          // optional
  "scannerDeviceId": "scanner_001"             // optional
}

Response 200:
{
  "data": {
    "participantId": "prt_abc123",
    "name": "Jane Smith",
    "status": "CHECKED_IN",
    "badgeValid": true,
    "checkInTime": "2026-03-15T08:45:00Z",
    "checkpoint": "Main Entrance",
    "photo": "https://cdn.example.com/photos/prt_abc123.jpg",
    "alerts": []
  }
}

Error Responses:
  400 Bad Request      - Invalid badge code format
  404 Not Found        - Badge code not recognized
  409 Conflict         - Already checked in
  422 Unprocessable    - Badge revoked or participant rejected
```

#### `GET /api/v1/events/:eventId/check-in/occupancy`

Get current occupancy for an event or checkpoint.

```
Permission: checkin:read
Rate Limit: General (100/min)

Query Parameters:
  ?checkpointId=string                         Filter by checkpoint

Response 200:
{
  "data": {
    "eventId": "evt_abc123",
    "totalCapacity": 1000,
    "currentOccupancy": 456,
    "occupancyRate": 0.456,
    "checkpoints": [
      {
        "id": "cp_entrance_main",
        "name": "Main Entrance",
        "checkedIn": 320,
        "checkedOut": 15
      }
    ],
    "lastUpdated": "2026-03-15T10:30:00Z"
  }
}
```

### 4.8 Analytics API

#### `GET /api/v1/events/:eventId/analytics/metrics`

Get real-time metrics for an event.

```
Permission: analytics:read
Rate Limit: General (100/min)

Query Parameters:
  ?metrics=registrations,approvals,rejections,checkins
  ?interval=hour|day|week
  ?from=ISO8601
  ?to=ISO8601

Response 200:
{
  "data": {
    "eventId": "evt_abc123",
    "period": { "from": "2026-02-01", "to": "2026-02-11" },
    "metrics": {
      "registrations": {
        "total": 500,
        "timeseries": [
          { "timestamp": "2026-02-01", "value": 45 },
          { "timestamp": "2026-02-02", "value": 62 }
        ]
      },
      "approvals": { "total": 350, "timeseries": [...] },
      "rejections": { "total": 25, "timeseries": [...] }
    }
  }
}
```

#### `GET /api/v1/events/:eventId/analytics/snapshot`

Get a point-in-time snapshot of event status.

```
Permission: analytics:read
Rate Limit: General (100/min)

Response 200:
{
  "data": {
    "eventId": "evt_abc123",
    "snapshotAt": "2026-02-11T10:00:00Z",
    "participants": {
      "total": 500,
      "byStatus": {
        "REGISTERED": 50,
        "PENDING": 75,
        "APPROVED": 350,
        "REJECTED": 25
      },
      "byOrganization": [
        { "name": "UN Mission", "count": 120 },
        { "name": "EU Delegation", "count": 85 }
      ]
    },
    "workflow": {
      "averageProcessingTime": "2h 15m",
      "slaBreaches": 3,
      "bottleneckStep": "document-review"
    },
    "badges": {
      "printed": 300,
      "collected": 250,
      "pending": 50
    }
  }
}
```

#### `POST /api/v1/events/:eventId/analytics/reports`

Generate a report (async).

```
Permission: analytics:export
Rate Limit: Mutations (50/min)

Request Body:
{
  "type": "PARTICIPANT_LIST|STATUS_SUMMARY|WORKFLOW_AUDIT|BADGE_REPORT",
  "format": "CSV|XLSX|PDF",
  "filters": {
    "status": ["APPROVED", "PRINTED"],
    "dateRange": { "from": "2026-02-01", "to": "2026-02-11" }
  }
}

Response 202:
{
  "data": {
    "reportId": "rpt_abc123",
    "status": "GENERATING",
    "estimatedCompletionAt": "2026-02-11T10:05:00Z",
    "_links": {
      "self": "/api/v1/events/evt_abc123/analytics/reports/rpt_abc123",
      "download": null
    }
  }
}
```

### 4.9 Webhooks API

#### `GET /api/v1/webhooks`

List webhook subscriptions.

```
Permission: webhooks:read
Rate Limit: General (100/min)

Response 200:
{
  "data": [
    {
      "id": "wh_abc123",
      "url": "https://example.com/webhooks/accreditation",
      "events": ["participant.registered", "participant.approved"],
      "status": "ACTIVE",
      "consecutiveFailures": 0,
      "createdAt": "2026-01-15T00:00:00Z",
      "_links": {
        "self": "/api/v1/webhooks/wh_abc123",
        "deliveries": "/api/v1/webhooks/wh_abc123/deliveries",
        "test": "/api/v1/webhooks/wh_abc123/test"
      }
    }
  ]
}
```

#### `POST /api/v1/webhooks`

Create a webhook subscription.

```
Permission: webhooks:write
Rate Limit: Mutations (50/min)

Request Body:
{
  "url": "https://example.com/webhooks/accreditation",  // required, HTTPS
  "events": ["participant.registered", "participant.approved"],  // required
  "description": "Sync approvals to external CRM",      // optional
  "headers": { "X-Custom": "value" },                   // optional
  "maxRetries": 5,                                       // optional, default 5
  "timeoutMs": 10000                                     // optional, default 10000
}

Response 201:
{
  "data": {
    "id": "wh_new123",
    "secret": "whsec_abc123...xyz",                     // Only returned on creation
    ...subscription fields...
  }
}

Note: The secret is returned ONLY on creation. Store it securely.
```

#### `PUT /api/v1/webhooks/:webhookId`

Update a webhook subscription.

```
Permission: webhooks:write
Rate Limit: Mutations (50/min)
```

#### `DELETE /api/v1/webhooks/:webhookId`

Delete a webhook subscription.

```
Permission: webhooks:delete
Rate Limit: Mutations (50/min)

Response 204: No Content
```

#### `GET /api/v1/webhooks/:webhookId/deliveries`

List delivery history for a webhook.

```
Permission: webhooks:read
Rate Limit: General (100/min)

Query Parameters:
  ?status=DELIVERED|FAILED|RETRYING|DEAD_LETTER
  ?eventType=participant.registered
  ?from=ISO8601
  ?to=ISO8601
  ?page, ?pageSize

Response 200:
{
  "data": [
    {
      "id": "del_abc123",
      "eventType": "participant.registered",
      "status": "DELIVERED",
      "attempts": 1,
      "responseCode": 200,
      "latencyMs": 145,
      "deliveredAt": "2026-02-10T12:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### `POST /api/v1/webhooks/:webhookId/test`

Send a test event to the webhook endpoint.

```
Permission: webhooks:write
Rate Limit: Mutations (50/min)

Request Body:
{
  "eventType": "participant.registered"        // optional, defaults to "test.ping"
}

Response 200:
{
  "data": {
    "success": true,
    "responseCode": 200,
    "latencyMs": 230,
    "responseBody": "OK"
  }
}
```

### 4.10 API Keys API

#### `GET /api/v1/api-keys`

List API keys (key values are never returned).

```
Permission: api-keys:read
Rate Limit: General (100/min)

Response 200:
{
  "data": [
    {
      "id": "ak_abc123",
      "name": "Production CRM Integration",
      "keyPrefix": "ak_live_",
      "permissions": ["events:read", "participants:read", "participants:write"],
      "scopes": { "eventIds": ["evt_abc123"] },
      "rateLimitTier": "STANDARD",
      "status": "ACTIVE",
      "lastUsedAt": "2026-02-11T09:00:00Z",
      "usageCount": 15234,
      "expiresAt": null,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/v1/api-keys`

Create a new API key.

```
Permission: api-keys:write
Rate Limit: Auth (10/min)

Request Body:
{
  "name": "Production CRM Integration",        // required
  "description": "Used by Salesforce sync",     // optional
  "permissions": [                              // required
    "events:read",
    "participants:read",
    "participants:write"
  ],
  "scopes": {                                   // optional (empty = all resources)
    "eventIds": ["evt_abc123"]
  },
  "rateLimitTier": "STANDARD",                  // optional, default STANDARD
  "expiresAt": "2027-01-01T00:00:00Z",         // optional
  "allowedIps": ["203.0.113.0/24"],            // optional
  "allowedOrigins": ["https://crm.example.com"] // optional
}

Response 201:
{
  "data": {
    "id": "ak_new456",
    "apiKey": "ak_live_abc123...full_key_here",  // Only returned on creation
    "keyPrefix": "ak_live_",
    ...key metadata...
  }
}

IMPORTANT: The full API key is returned ONLY on creation. It cannot be retrieved later.
```

#### `POST /api/v1/api-keys/:keyId/rotate`

Rotate an API key (creates new key, old key enters grace period).

```
Permission: api-keys:write
Rate Limit: Auth (10/min)

Request Body:
{
  "gracePeriodHours": 24                       // optional, default 24
}

Response 201:
{
  "data": {
    "newKey": {
      "id": "ak_new789",
      "apiKey": "ak_live_new_key_value",       // New key value
      ...key metadata...
    },
    "oldKey": {
      "id": "ak_abc123",
      "status": "ROTATED",
      "rotationGraceEnd": "2026-02-12T10:00:00Z"
    }
  }
}
```

#### `POST /api/v1/api-keys/:keyId/revoke`

Immediately revoke an API key.

```
Permission: api-keys:write
Rate Limit: Auth (10/min)

Response 200:
{
  "data": {
    "id": "ak_abc123",
    "status": "REVOKED",
    "revokedAt": "2026-02-11T10:00:00Z"
  }
}
```

### 4.11 Rate Limiting Tiers

| Tier               | Limit        | Window   | Applied To                                      |
| ------------------ | ------------ | -------- | ----------------------------------------------- |
| **General**        | 100 requests | 1 minute | GET endpoints, read operations                  |
| **Mutations**      | 50 requests  | 1 minute | POST/PUT/DELETE endpoints                       |
| **Auth**           | 10 requests  | 1 minute | API key creation, rotation, auth endpoints      |
| **API Key Custom** | Configurable | 1 minute | Per-key override (uses `rateLimitCustom` field) |

**Rate limit headers returned with every response:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1707648000
Retry-After: 13                               // Only on 429 responses
```

**Rate limit implementation:**

```typescript
// Sliding window rate limiter using Redis-compatible in-memory store
interface RateLimitConfig {
  tier: RateLimitTier;
  limits: {
    STANDARD: { requests: 100; windowMs: 60000 };
    ELEVATED: { requests: 500; windowMs: 60000 };
    PREMIUM: { requests: 2000; windowMs: 60000 };
    CUSTOM: { requests: number; windowMs: 60000 };
  };
}
```

---

## 5. Business Logic

### 5.1 Source Implementation: SSE Loader

Live queue updates for validators, printers, and dispatchers:

```typescript
// app/routes/validator+/requests+/stream.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserWithRoles(request, ["validator", "reviewer"]);
  const accessibleStepIds = await getUserAccessibleStepIds(user.id);

  return eventStream(request.signal, (send) => {
    const interval = setInterval(async () => {
      const counts = await getQueueCounts(accessibleStepIds);
      send({ event: "queue-update", data: JSON.stringify(counts) });
    }, 5000);
    return () => clearInterval(interval);
  });
}
```

### 5.2 Source Implementation: Optimistic Locking

Prevent concurrent actions on the same participant:

```typescript
// Check version before processing
const participant = await prisma.participant.findUnique({ where: { id } });
if (participant.updatedAt.getTime() !== expectedVersion) {
  throw new ConflictError("Participant was modified by another user");
}
```

Display "Being reviewed by [User]" indicators in validator queue.

### 5.3 Source Implementation: Notification Creation

```typescript
// On workflow action, create notifications
await prisma.notification.create({
  data: {
    tenantId,
    userId: participant.userId,
    type: "APPROVAL",
    title: "Registration Approved",
    body: `Your registration for ${event.name} has been approved.`,
    metadata: { participantId, eventId },
  },
});
```

Notification bell with unread count, real-time push via SSE.

### 5.4 Source Implementation: REST API Routes

RESTful API for external integrations, authenticated via API key:

```
GET    /api/v1/events                              List events
GET    /api/v1/events/:eventId                     Get event
GET    /api/v1/events/:eventId/participants         List participants
GET    /api/v1/events/:eventId/participants/:id     Get participant
POST   /api/v1/events/:eventId/participants/:id/approve  Approve
POST   /api/v1/events/:eventId/participants/:id/reject   Reject
GET    /api/v1/events/:eventId/stats               Event statistics

POST   /api/v1/webhooks                            Subscribe to events
DELETE /api/v1/webhooks/:id                         Unsubscribe
```

### 5.5 Source Implementation: Webhook Events

```
participant.registered
participant.approved
participant.rejected
participant.printed
participant.collected
workflow.step.completed
workflow.sla.breached
```

### 5.6 Source Implementation: Response Format

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 5.7 API Key Lifecycle

#### Key Generation

```typescript
// app/services/api-key.server.ts
import crypto from "crypto";
import bcrypt from "bcryptjs";

interface CreateApiKeyInput {
  tenantId: string;
  name: string;
  description?: string;
  permissions: string[];
  scopes?: { eventIds?: string[] };
  rateLimitTier?: RateLimitTier;
  expiresAt?: Date;
  allowedIps?: string[];
  allowedOrigins?: string[];
  createdBy: string;
}

interface CreateApiKeyResult {
  apiKey: string; // Plain-text key (returned once, never stored)
  keyRecord: ApiKey; // Database record (hash stored)
}

const API_KEY_PREFIX = "ak_live_";
const API_KEY_BYTES = 32;
const BCRYPT_ROUNDS = 12;

export async function createApiKey(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
  // Generate cryptographically secure random key
  const rawKey = crypto.randomBytes(API_KEY_BYTES).toString("base64url");
  const fullKey = `${API_KEY_PREFIX}${rawKey}`;

  // Hash for storage (plain-text key is NEVER stored)
  const keyHash = await bcrypt.hash(fullKey, BCRYPT_ROUNDS);

  // Validate permissions against allowed set
  validatePermissions(input.permissions);

  // Validate scopes (ensure referenced events exist in tenant)
  if (input.scopes?.eventIds) {
    await validateEventScopes(input.tenantId, input.scopes.eventIds);
  }

  const keyRecord = await prisma.apiKey.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      keyHash,
      keyPrefix: API_KEY_PREFIX,
      permissions: input.permissions,
      scopes: input.scopes ?? undefined,
      rateLimitTier: input.rateLimitTier ?? "STANDARD",
      expiresAt: input.expiresAt,
      allowedIps: input.allowedIps ?? [],
      allowedOrigins: input.allowedOrigins ?? [],
      createdBy: input.createdBy,
      status: "ACTIVE",
    },
  });

  return { apiKey: fullKey, keyRecord };
}
```

#### Key Validation

```typescript
// app/middleware/api-key-auth.server.ts
import bcrypt from "bcryptjs";

interface ValidatedApiKey {
  id: string;
  tenantId: string;
  permissions: string[];
  scopes: { eventIds?: string[] } | null;
  rateLimitTier: RateLimitTier;
  rateLimitCustom: number | null;
}

// In-memory cache for validated keys (TTL: 5 minutes)
const keyCache = new Map<string, { key: ValidatedApiKey; expiresAt: number }>();
const KEY_CACHE_TTL_MS = 5 * 60 * 1000;

export async function validateApiKey(apiKeyHeader: string | null): Promise<ValidatedApiKey> {
  if (!apiKeyHeader) {
    throw new ApiError(401, "MISSING_API_KEY", "X-API-Key header is required");
  }

  // Check cache first
  const cached = keyCache.get(apiKeyHeader);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.key;
  }

  // Query all active keys and find match via bcrypt comparison
  // NOTE: In production, use key prefix to narrow search
  const prefix = apiKeyHeader.substring(0, 8);
  const candidates = await prisma.apiKey.findMany({
    where: {
      keyPrefix: prefix,
      status: { in: ["ACTIVE", "ROTATED"] },
    },
  });

  let matchedKey: (typeof candidates)[0] | null = null;
  for (const candidate of candidates) {
    // Check if rotated key is past grace period
    if (
      candidate.status === "ROTATED" &&
      candidate.rotationGraceEnd &&
      candidate.rotationGraceEnd < new Date()
    ) {
      continue;
    }

    const isMatch = await bcrypt.compare(apiKeyHeader, candidate.keyHash);
    if (isMatch) {
      matchedKey = candidate;
      break;
    }
  }

  if (!matchedKey) {
    throw new ApiError(401, "INVALID_API_KEY", "The provided API key is invalid");
  }

  // Check expiry
  if (matchedKey.expiresAt && matchedKey.expiresAt < new Date()) {
    throw new ApiError(401, "EXPIRED_API_KEY", "The API key has expired");
  }

  // Update usage tracking (fire-and-forget)
  prisma.apiKey
    .update({
      where: { id: matchedKey.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    })
    .catch(() => {}); // Non-blocking

  const validatedKey: ValidatedApiKey = {
    id: matchedKey.id,
    tenantId: matchedKey.tenantId,
    permissions: matchedKey.permissions,
    scopes: matchedKey.scopes as { eventIds?: string[] } | null,
    rateLimitTier: matchedKey.rateLimitTier,
    rateLimitCustom: matchedKey.rateLimitCustom,
  };

  // Cache the validated key
  keyCache.set(apiKeyHeader, {
    key: validatedKey,
    expiresAt: Date.now() + KEY_CACHE_TTL_MS,
  });

  return validatedKey;
}
```

#### Key Rotation

```typescript
// app/services/api-key.server.ts
export async function rotateApiKey(
  keyId: string,
  tenantId: string,
  gracePeriodHours: number = 24,
  rotatedBy: string,
): Promise<{ newKey: CreateApiKeyResult; oldKeyId: string }> {
  const existingKey = await prisma.apiKey.findFirst({
    where: { id: keyId, tenantId, status: "ACTIVE" },
  });

  if (!existingKey) {
    throw new ApiError(404, "KEY_NOT_FOUND", "API key not found");
  }

  return await prisma.$transaction(async (tx) => {
    // Create new key with same config
    const newKeyResult = await createApiKey({
      tenantId,
      name: existingKey.name,
      description: existingKey.description ?? undefined,
      permissions: existingKey.permissions,
      scopes: existingKey.scopes as { eventIds?: string[] } | undefined,
      rateLimitTier: existingKey.rateLimitTier,
      expiresAt: existingKey.expiresAt ?? undefined,
      allowedIps: existingKey.allowedIps,
      allowedOrigins: existingKey.allowedOrigins,
      createdBy: rotatedBy,
    });

    // Mark old key as rotated with grace period
    await tx.apiKey.update({
      where: { id: keyId },
      data: {
        status: "ROTATED",
        rotationGraceEnd: new Date(Date.now() + gracePeriodHours * 60 * 60 * 1000),
      },
    });

    // Link rotation chain
    await tx.apiKey.update({
      where: { id: newKeyResult.keyRecord.id },
      data: { rotatedFromId: keyId },
    });

    // Invalidate cache for old key
    invalidateKeyCache(keyId);

    return { newKey: newKeyResult, oldKeyId: keyId };
  });
}

export async function revokeApiKey(keyId: string, tenantId: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: keyId, tenantId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  // Immediately invalidate cache
  invalidateKeyCache(keyId);
}

function invalidateKeyCache(keyId: string): void {
  for (const [rawKey, cached] of keyCache.entries()) {
    if (cached.key.id === keyId) {
      keyCache.delete(rawKey);
    }
  }
}
```

### 5.8 Webhook Delivery Engine

#### HMAC-SHA256 Signature Generation

```typescript
// app/services/webhook-delivery.server.ts
import crypto from "crypto";

interface WebhookPayload {
  id: string; // Unique delivery ID
  type: string; // Event type
  timestamp: string; // ISO 8601
  tenantId: string;
  data: Record<string, unknown>;
}

function generateWebhookSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  return `sha256=${hmac.digest("hex")}`;
}

function buildWebhookHeaders(
  payload: string,
  secret: string,
  deliveryId: string,
  customHeaders?: Record<string, string>,
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "User-Agent": "AccreditationPlatform-Webhook/1.0",
    "X-Webhook-Id": deliveryId,
    "X-Webhook-Timestamp": new Date().toISOString(),
    "X-Webhook-Signature": generateWebhookSignature(payload, secret),
    ...(customHeaders ?? {}),
  };
}
```

#### Delivery with Exponential Backoff

```typescript
// app/services/webhook-delivery.server.ts
const DEFAULT_RETRY_DELAYS_MS = [1000, 5000, 30000, 300000, 1800000];
// Retry schedule: 1s → 5s → 30s → 5min → 30min

interface DeliveryResult {
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  errorMessage?: string;
  errorType?: string;
}

export async function deliverWebhook(
  subscription: WebhookSubscription,
  event: WebhookPayload,
): Promise<void> {
  const payload = JSON.stringify(event);

  // Create delivery record
  const delivery = await prisma.webhookDelivery.create({
    data: {
      tenantId: subscription.tenantId,
      subscriptionId: subscription.id,
      eventType: event.type,
      eventId: event.id,
      payload: event as unknown as Prisma.InputJsonValue,
      status: "PENDING",
      maxAttempts: subscription.maxRetries,
    },
  });

  // Attempt delivery
  const result = await attemptDelivery(subscription, payload, delivery.id);

  if (result.success) {
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "DELIVERED",
        attempts: 1,
        responseCode: result.statusCode,
        latencyMs: result.latencyMs,
        deliveredAt: new Date(),
      },
    });

    // Reset circuit breaker on success
    if (subscription.consecutiveFailures > 0) {
      await prisma.webhookSubscription.update({
        where: { id: subscription.id },
        data: {
          consecutiveFailures: 0,
          circuitBreakerOpen: false,
        },
      });
    }
  } else {
    await scheduleRetry(delivery, subscription, result);
  }
}

async function attemptDelivery(
  subscription: WebhookSubscription,
  payload: string,
  deliveryId: string,
): Promise<DeliveryResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), subscription.timeoutMs);

  try {
    const headers = buildWebhookHeaders(
      payload,
      subscription.secret,
      deliveryId,
      subscription.headers as Record<string, string> | undefined,
    );

    const response = await fetch(subscription.url, {
      method: "POST",
      headers,
      body: payload,
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      return { success: true, statusCode: response.status, latencyMs };
    }

    return {
      success: false,
      statusCode: response.status,
      latencyMs,
      errorMessage: `HTTP ${response.status}: ${response.statusText}`,
      errorType: "HTTP_ERROR",
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        success: false,
        latencyMs,
        errorMessage: `Request timed out after ${subscription.timeoutMs}ms`,
        errorType: "TIMEOUT",
      };
    }

    return {
      success: false,
      latencyMs,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      errorType: "CONNECTION_REFUSED",
    };
  } finally {
    clearTimeout(timeout);
  }
}
```

#### Retry Scheduling and Circuit Breaker

```typescript
// app/services/webhook-delivery.server.ts
const CIRCUIT_BREAKER_THRESHOLD = 10; // Consecutive failures to open circuit
const CIRCUIT_BREAKER_RESET_MS = 30 * 60 * 1000; // 30 minutes

async function scheduleRetry(
  delivery: WebhookDelivery,
  subscription: WebhookSubscription,
  result: DeliveryResult,
): Promise<void> {
  const newAttempts = delivery.attempts + 1;
  const retryDelays = subscription.retryBackoffMs as number[];

  if (newAttempts >= delivery.maxAttempts) {
    // Exhausted retries -- move to dead letter queue
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "DEAD_LETTER",
        attempts: newAttempts,
        responseCode: result.statusCode,
        latencyMs: result.latencyMs,
        errorMessage: result.errorMessage,
        errorType: result.errorType,
      },
    });

    // Increment consecutive failures
    await updateCircuitBreaker(subscription);
    return;
  }

  // Schedule next retry
  const delayMs = retryDelays[Math.min(newAttempts - 1, retryDelays.length - 1)];
  const nextRetryAt = new Date(Date.now() + delayMs);

  await prisma.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      status: "RETRYING",
      attempts: newAttempts,
      nextRetryAt,
      responseCode: result.statusCode,
      latencyMs: result.latencyMs,
      errorMessage: result.errorMessage,
      errorType: result.errorType,
    },
  });
}

async function updateCircuitBreaker(subscription: WebhookSubscription): Promise<void> {
  const newFailureCount = subscription.consecutiveFailures + 1;

  if (newFailureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    // Open circuit breaker
    await prisma.webhookSubscription.update({
      where: { id: subscription.id },
      data: {
        consecutiveFailures: newFailureCount,
        circuitBreakerOpen: true,
        circuitBreakerResetAt: new Date(Date.now() + CIRCUIT_BREAKER_RESET_MS),
        status: "DISABLED",
      },
    });

    // Emit internal event for alerting
    eventBus.emit("webhook.circuit_breaker.opened", {
      subscriptionId: subscription.id,
      tenantId: subscription.tenantId,
      consecutiveFailures: newFailureCount,
    });
  } else {
    await prisma.webhookSubscription.update({
      where: { id: subscription.id },
      data: { consecutiveFailures: newFailureCount },
    });
  }
}

// Retry queue processor (runs on interval)
export async function processRetryQueue(): Promise<void> {
  const pendingRetries = await prisma.webhookDelivery.findMany({
    where: {
      status: "RETRYING",
      nextRetryAt: { lte: new Date() },
    },
    include: { subscription: true },
    take: 50, // Process in batches
    orderBy: { nextRetryAt: "asc" },
  });

  for (const delivery of pendingRetries) {
    // Skip if circuit breaker is open
    if (delivery.subscription.circuitBreakerOpen) {
      // Check if reset time has passed
      if (
        delivery.subscription.circuitBreakerResetAt &&
        delivery.subscription.circuitBreakerResetAt <= new Date()
      ) {
        // Half-open: attempt one delivery to test
        await prisma.webhookSubscription.update({
          where: { id: delivery.subscription.id },
          data: { circuitBreakerOpen: false, status: "ACTIVE" },
        });
      } else {
        continue; // Skip, circuit still open
      }
    }

    const payload = JSON.stringify(delivery.payload);
    const result = await attemptDelivery(delivery.subscription, payload, delivery.id);

    if (result.success) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "DELIVERED",
          attempts: delivery.attempts + 1,
          responseCode: result.statusCode,
          latencyMs: result.latencyMs,
          deliveredAt: new Date(),
        },
      });

      // Reset circuit breaker on success
      await prisma.webhookSubscription.update({
        where: { id: delivery.subscription.id },
        data: { consecutiveFailures: 0, circuitBreakerOpen: false },
      });
    } else {
      await scheduleRetry(delivery, delivery.subscription, result);
    }
  }
}
```

### 5.9 SSE Scaling Strategy

#### Connection Registry

```typescript
// app/services/sse-manager.server.ts
import { EventEmitter } from "events";

interface SSEClient {
  id: string;
  userId: string;
  tenantId: string;
  roles: string[];
  channels: Set<string>;
  send: (event: string, data: string, id?: string) => void;
  close: () => void;
  lastEventId: string | null;
  connectedAt: Date;
  lastHeartbeat: Date;
}

class SSEConnectionManager {
  private connections = new Map<string, SSEClient>();
  private userConnections = new Map<string, Set<string>>();
  private channelSubscribers = new Map<string, Set<string>>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reaperInterval: NodeJS.Timeout | null = null;
  private serverInstance: string;

  constructor() {
    this.serverInstance = process.env.HOSTNAME ?? `node-${process.pid}`;
    this.startHeartbeat();
    this.startReaper();
  }

  async register(client: SSEClient): Promise<void> {
    this.connections.set(client.id, client);

    // Track by user
    if (!this.userConnections.has(client.userId)) {
      this.userConnections.set(client.userId, new Set());
    }
    this.userConnections.get(client.userId)!.add(client.id);

    // Track by channel
    for (const channel of client.channels) {
      if (!this.channelSubscribers.has(channel)) {
        this.channelSubscribers.set(channel, new Set());
      }
      this.channelSubscribers.get(channel)!.add(client.id);
    }

    // Persist to database for cross-instance visibility
    await prisma.sSEConnection.create({
      data: {
        id: client.id,
        tenantId: client.tenantId,
        userId: client.userId,
        channels: Array.from(client.channels),
        lastEventId: client.lastEventId,
        serverInstance: this.serverInstance,
        status: "ACTIVE",
      },
    });

    // Replay missed events if reconnecting
    if (client.lastEventId) {
      await this.replayEvents(client);
    }
  }

  async unregister(connectionId: string): Promise<void> {
    const client = this.connections.get(connectionId);
    if (!client) return;

    // Remove from user tracking
    const userConns = this.userConnections.get(client.userId);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) {
        this.userConnections.delete(client.userId);
      }
    }

    // Remove from channel tracking
    for (const channel of client.channels) {
      const channelConns = this.channelSubscribers.get(channel);
      if (channelConns) {
        channelConns.delete(connectionId);
        if (channelConns.size === 0) {
          this.channelSubscribers.delete(channel);
        }
      }
    }

    this.connections.delete(connectionId);

    // Update database
    await prisma.sSEConnection
      .update({
        where: { id: connectionId },
        data: {
          status: "DISCONNECTED",
          disconnectedAt: new Date(),
        },
      })
      .catch(() => {}); // Best-effort
  }

  broadcast(channel: string, event: string, data: string, id?: string): void {
    const subscribers = this.channelSubscribers.get(channel);
    if (!subscribers) return;

    for (const connectionId of subscribers) {
      const client = this.connections.get(connectionId);
      if (client) {
        try {
          client.send(event, data, id);
          client.lastHeartbeat = new Date();
        } catch {
          // Connection broken, schedule cleanup
          this.unregister(connectionId);
        }
      }
    }
  }

  sendToUser(userId: string, event: string, data: string, id?: string): void {
    const userConns = this.userConnections.get(userId);
    if (!userConns) return;

    for (const connectionId of userConns) {
      const client = this.connections.get(connectionId);
      if (client) {
        try {
          client.send(event, data, id);
        } catch {
          this.unregister(connectionId);
        }
      }
    }
  }

  // Heartbeat: send keepalive every 30 seconds
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      for (const [id, client] of this.connections) {
        try {
          client.send("heartbeat", JSON.stringify({ timestamp: now.toISOString() }));
          client.lastHeartbeat = now;
        } catch {
          this.unregister(id);
        }
      }
    }, 30_000);
  }

  // Reaper: remove stale connections (no heartbeat > 5 min)
  private startReaper(): void {
    this.reaperInterval = setInterval(() => {
      const staleThreshold = Date.now() - 5 * 60 * 1000;
      for (const [id, client] of this.connections) {
        if (client.lastHeartbeat.getTime() < staleThreshold) {
          client.close();
          this.unregister(id);
        }
      }
    }, 60_000);
  }

  // Replay events missed during disconnect
  private async replayEvents(client: SSEClient): Promise<void> {
    // Query events after lastEventId from event store
    // This requires an event store (see Internal Event Bus)
    const missedEvents = await prisma.domainEvent.findMany({
      where: {
        tenantId: client.tenantId,
        id: { gt: client.lastEventId! },
        channel: { in: Array.from(client.channels) },
      },
      orderBy: { createdAt: "asc" },
      take: 100, // Cap replay to prevent flooding
    });

    for (const event of missedEvents) {
      client.send(event.type, JSON.stringify(event.payload), event.id);
    }
  }

  // Graceful shutdown: drain all connections
  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.reaperInterval) clearInterval(this.reaperInterval);

    // Notify clients of impending shutdown
    for (const [id, client] of this.connections) {
      try {
        client.send("shutdown", JSON.stringify({ message: "Server restarting" }));
        client.close();
      } catch {
        // Ignore errors during shutdown
      }
    }

    // Mark all connections as draining in DB
    await prisma.sSEConnection.updateMany({
      where: {
        serverInstance: this.serverInstance,
        status: "ACTIVE",
      },
      data: { status: "DRAINING" },
    });

    this.connections.clear();
    this.userConnections.clear();
    this.channelSubscribers.clear();
  }

  getStats(): {
    totalConnections: number;
    uniqueUsers: number;
    channelCount: number;
  } {
    return {
      totalConnections: this.connections.size,
      uniqueUsers: this.userConnections.size,
      channelCount: this.channelSubscribers.size,
    };
  }
}

export const sseManager = new SSEConnectionManager();
```

### 5.10 Optimistic Locking Implementation

```typescript
// app/services/optimistic-lock.server.ts

/**
 * Optimistic locking ensures that concurrent updates to the same resource
 * do not silently overwrite each other. Each mutable resource includes a
 * version field (updatedAt timestamp). Clients must send the expected
 * version in the If-Match header. If the versions don't match, a 409
 * Conflict is returned with the current state.
 */

interface OptimisticLockCheck {
  resourceId: string;
  resourceType: string;
  expectedVersion: number; // updatedAt.getTime()
}

export class ConflictError extends Error {
  public readonly statusCode = 409;
  public readonly code = "CONFLICT";
  public readonly currentResource: Record<string, unknown>;

  constructor(message: string, currentResource: Record<string, unknown>) {
    super(message);
    this.name = "ConflictError";
    this.currentResource = currentResource;
  }
}

export async function checkOptimisticLock<T extends { updatedAt: Date }>(
  resource: T | null,
  expectedVersion: string | null,
  resourceType: string,
): Promise<T> {
  if (!resource) {
    throw new ApiError(404, "NOT_FOUND", `${resourceType} not found`);
  }

  if (!expectedVersion) {
    throw new ApiError(
      428,
      "PRECONDITION_REQUIRED",
      "If-Match header with version is required for mutations",
    );
  }

  const currentVersion = resource.updatedAt.getTime();
  const expected = parseInt(expectedVersion, 10);

  if (currentVersion !== expected) {
    throw new ConflictError(
      `${resourceType} was modified by another user. ` +
        `Expected version ${expected}, current version ${currentVersion}.`,
      resource as unknown as Record<string, unknown>,
    );
  }

  return resource;
}

// Usage in a Remix action
export async function approveParticipant(
  participantId: string,
  expectedVersion: string | null,
  userId: string,
  comment?: string,
) {
  // Check version before processing
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });

  await checkOptimisticLock(participant, expectedVersion, "Participant");

  // Proceed with update (Prisma handles the actual write)
  const updated = await prisma.participant.update({
    where: {
      id: participantId,
      updatedAt: participant!.updatedAt, // Prisma-level optimistic lock
    },
    data: {
      status: "APPROVED",
      approvedBy: userId,
      approvedAt: new Date(),
    },
  });

  return updated;
}
```

### 5.11 Internal Event Bus

```typescript
// app/services/event-bus.server.ts
import { EventEmitter } from "events";

// Domain event type definitions
interface DomainEvents {
  "participant.registered": ParticipantRegisteredEvent;
  "participant.approved": ParticipantApprovedEvent;
  "participant.rejected": ParticipantRejectedEvent;
  "participant.printed": ParticipantPrintedEvent;
  "participant.collected": ParticipantCollectedEvent;
  "workflow.step.completed": WorkflowStepCompletedEvent;
  "workflow.sla.breached": WorkflowSLABreachedEvent;
  "badge.printed": BadgePrintedEvent;
  "badge.collected": BadgeCollectedEvent;
  "checkin.scanned": CheckInScannedEvent;
  "delegation.quota.warning": DelegationQuotaWarningEvent;
  "api_key.created": ApiKeyCreatedEvent;
  "api_key.rotated": ApiKeyRotatedEvent;
  "api_key.revoked": ApiKeyRevokedEvent;
  "webhook.circuit_breaker.opened": WebhookCircuitBreakerEvent;
  "webhook.delivery.failed": WebhookDeliveryFailedEvent;
}

// Base event structure
interface BaseEvent {
  id: string;
  tenantId: string;
  timestamp: string;
  correlationId?: string;
  causationId?: string;
}

interface ParticipantRegisteredEvent extends BaseEvent {
  participantId: string;
  eventId: string;
  email: string;
  name: string;
}

interface ParticipantApprovedEvent extends BaseEvent {
  participantId: string;
  eventId: string;
  approvedBy: string;
  comment?: string;
}

interface ParticipantRejectedEvent extends BaseEvent {
  participantId: string;
  eventId: string;
  rejectedBy: string;
  reason: string;
}

interface ParticipantPrintedEvent extends BaseEvent {
  participantId: string;
  eventId: string;
  badgeId: string;
  printedBy: string;
}

interface ParticipantCollectedEvent extends BaseEvent {
  participantId: string;
  eventId: string;
  badgeId: string;
  collectedAt: string;
}

interface WorkflowStepCompletedEvent extends BaseEvent {
  workflowInstanceId: string;
  participantId: string;
  eventId: string;
  stepId: string;
  action: string;
  performedBy: string;
}

interface WorkflowSLABreachedEvent extends BaseEvent {
  workflowInstanceId: string;
  participantId: string;
  eventId: string;
  stepId: string;
  slaHours: number;
  actualHours: number;
}

interface BadgePrintedEvent extends BaseEvent {
  badgeId: string;
  participantId: string;
  eventId: string;
  printedBy: string;
}

interface BadgeCollectedEvent extends BaseEvent {
  badgeId: string;
  participantId: string;
  eventId: string;
}

interface CheckInScannedEvent extends BaseEvent {
  participantId: string;
  eventId: string;
  checkpointId: string;
  scannerDeviceId?: string;
}

interface DelegationQuotaWarningEvent extends BaseEvent {
  delegationId: string;
  eventId: string;
  quotaUsedPercent: number;
}

interface ApiKeyCreatedEvent extends BaseEvent {
  apiKeyId: string;
  name: string;
  createdBy: string;
}

interface ApiKeyRotatedEvent extends BaseEvent {
  oldKeyId: string;
  newKeyId: string;
  rotatedBy: string;
}

interface ApiKeyRevokedEvent extends BaseEvent {
  apiKeyId: string;
  revokedBy: string;
}

interface WebhookCircuitBreakerEvent extends BaseEvent {
  subscriptionId: string;
  consecutiveFailures: number;
}

interface WebhookDeliveryFailedEvent extends BaseEvent {
  deliveryId: string;
  subscriptionId: string;
  eventType: string;
  errorType: string;
}

// Typed event bus with middleware support
type EventHandler<T> = (event: T) => Promise<void> | void;
type EventMiddleware = (
  eventName: string,
  event: BaseEvent,
  next: () => Promise<void>,
) => Promise<void>;

class TypedEventBus {
  private emitter = new EventEmitter();
  private middlewares: EventMiddleware[] = [];

  constructor() {
    // Increase max listeners for production use
    this.emitter.setMaxListeners(50);
  }

  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  on<K extends keyof DomainEvents>(event: K, handler: EventHandler<DomainEvents[K]>): void {
    this.emitter.on(event, handler);
  }

  off<K extends keyof DomainEvents>(event: K, handler: EventHandler<DomainEvents[K]>): void {
    this.emitter.off(event, handler);
  }

  async emit<K extends keyof DomainEvents>(eventName: K, event: DomainEvents[K]): Promise<void> {
    // Run through middleware chain
    let middlewareIndex = 0;

    const runMiddleware = async (): Promise<void> => {
      if (middlewareIndex < this.middlewares.length) {
        const middleware = this.middlewares[middlewareIndex++];
        await middleware(eventName as string, event, runMiddleware);
      } else {
        // All middleware passed, emit to handlers
        // Use setImmediate to prevent blocking the caller
        setImmediate(() => {
          this.emitter.emit(eventName, event);
        });
      }
    };

    await runMiddleware();
  }
}

// Singleton event bus
export const eventBus = new TypedEventBus();

// --- Middleware: Logging ---
eventBus.use(async (eventName, event, next) => {
  console.log(`[EventBus] ${eventName}`, {
    id: event.id,
    tenantId: event.tenantId,
    timestamp: event.timestamp,
  });
  await next();
});

// --- Middleware: Metrics ---
eventBus.use(async (eventName, event, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  // Record metric: event_bus_processing_duration_ms{event=eventName}
  metrics.histogram("event_bus_processing_duration_ms", duration, {
    event: eventName,
  });
});

// --- Middleware: Error Handler ---
eventBus.use(async (eventName, event, next) => {
  try {
    await next();
  } catch (error) {
    console.error(`[EventBus] Error in ${eventName} handler:`, error);
    // Don't rethrow: event bus errors should not propagate to callers
  }
});

// --- Subscriber: Webhook Dispatcher ---
// Listens to all events and dispatches to matching webhook subscriptions
function registerWebhookDispatcher(): void {
  const webhookEvents: (keyof DomainEvents)[] = [
    "participant.registered",
    "participant.approved",
    "participant.rejected",
    "participant.printed",
    "participant.collected",
    "workflow.step.completed",
    "workflow.sla.breached",
  ];

  for (const eventName of webhookEvents) {
    eventBus.on(eventName, async (event: BaseEvent) => {
      const subscriptions = await prisma.webhookSubscription.findMany({
        where: {
          tenantId: event.tenantId,
          status: "ACTIVE",
          events: { has: eventName },
          circuitBreakerOpen: false,
        },
      });

      for (const subscription of subscriptions) {
        await deliverWebhook(subscription, {
          id: crypto.randomUUID(),
          type: eventName,
          timestamp: event.timestamp,
          tenantId: event.tenantId,
          data: event as unknown as Record<string, unknown>,
        });
      }
    });
  }
}

// --- Subscriber: SSE Broadcaster ---
function registerSSEBroadcaster(): void {
  eventBus.on("participant.approved", async (event) => {
    sseManager.broadcast(
      `participant-status:${event.eventId}`,
      "participant-updated",
      JSON.stringify({
        participantId: event.participantId,
        status: "APPROVED",
        updatedAt: event.timestamp,
      }),
      event.id,
    );
  });

  eventBus.on("workflow.step.completed", async (event) => {
    sseManager.broadcast(
      "validator-queue",
      "queue-update",
      JSON.stringify({
        workflowInstanceId: event.workflowInstanceId,
        stepId: event.stepId,
        action: event.action,
      }),
      event.id,
    );
  });

  eventBus.on("workflow.sla.breached", async (event) => {
    sseManager.broadcast(
      "sla-alerts",
      "sla-breach",
      JSON.stringify({
        participantId: event.participantId,
        stepId: event.stepId,
        slaHours: event.slaHours,
        actualHours: event.actualHours,
      }),
      event.id,
    );
  });
}

// Initialize all subscribers on server startup
export function initializeEventBus(): void {
  registerWebhookDispatcher();
  registerSSEBroadcaster();
}
```

### 5.12 Request Validation Middleware

```typescript
// app/middleware/validation.server.ts
import { z } from "zod";

// Schema registry for all API endpoints
const schemas = new Map<
  string,
  {
    body?: z.ZodSchema;
    params?: z.ZodSchema;
    query?: z.ZodSchema;
  }
>();

// Participant creation schema
schemas.set("POST /api/v1/events/:eventId/participants", {
  params: z.object({
    eventId: z.string().min(1),
  }),
  body: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email().max(255),
    organization: z.string().max(200).optional(),
    phone: z.string().max(20).optional(),
    customFields: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

// Pagination query schema (reusable)
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Event list query schema
schemas.set("GET /api/v1/events", {
  query: paginationSchema.extend({
    status: z.enum(["ACTIVE", "DRAFT", "COMPLETED", "ARCHIVED"]).optional(),
    search: z.string().max(200).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    fields: z.string().optional(),
    include: z.string().optional(),
  }),
});

// Webhook creation schema
schemas.set("POST /api/v1/webhooks", {
  body: z.object({
    url: z.string().url().startsWith("https://"),
    events: z.array(z.string()).min(1),
    description: z.string().max(500).optional(),
    headers: z.record(z.string()).optional(),
    maxRetries: z.number().int().min(1).max(10).default(5),
    timeoutMs: z.number().int().min(1000).max(30000).default(10000),
  }),
});

// Validation middleware
export async function validationMiddleware(
  request: Request,
  context: ApiContext,
  next: () => Promise<Response>,
): Promise<Response> {
  const method = request.method;
  const url = new URL(request.url);
  const routePattern = resolveRoutePattern(method, url.pathname);

  const schema = schemas.get(routePattern);
  if (!schema) {
    return next(); // No schema defined, skip validation
  }

  const errors: Array<{ field: string; message: string }> = [];

  // Validate query parameters
  if (schema.query) {
    const queryObj = Object.fromEntries(url.searchParams);
    const result = schema.query.safeParse(queryObj);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          field: `query.${issue.path.join(".")}`,
          message: issue.message,
        });
      }
    }
  }

  // Validate request body
  if (schema.body && ["POST", "PUT", "PATCH"].includes(method)) {
    try {
      const body = await request.json();
      const result = schema.body.safeParse(body);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: `body.${issue.path.join(".")}`,
            message: issue.message,
          });
        }
      }
    } catch {
      errors.push({ field: "body", message: "Invalid JSON body" });
    }
  }

  if (errors.length > 0) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: errors,
        },
      },
      { status: 400 },
    );
  }

  return next();
}
```

### 5.13 Response Serialization

```typescript
// app/middleware/serialization.server.ts

interface ApiEnvelope<T> {
  data: T;
  pagination?: PaginationInfo;
  _links?: Record<string, string>;
  _meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Standard response envelope builder.
 * Supports field selection (?fields=), relation expansion (?include=),
 * and HATEOAS links.
 */
export function buildResponse<T extends Record<string, unknown>>(
  data: T | T[],
  options: {
    request: Request;
    context: ApiContext;
    pagination?: PaginationInfo;
    links?: Record<string, string>;
  },
): Response {
  const url = new URL(options.request.url);

  // Field selection: ?fields=id,name,email
  const fieldsParam = url.searchParams.get("fields");
  let processedData = data;
  if (fieldsParam) {
    const fields = fieldsParam.split(",").map((f) => f.trim());
    if (Array.isArray(processedData)) {
      processedData = processedData.map((item) => selectFields(item, fields)) as T[];
    } else {
      processedData = selectFields(processedData, fields) as T;
    }
  }

  const envelope: ApiEnvelope<T | T[]> = {
    data: processedData,
    _meta: {
      requestId: options.context.requestId,
      timestamp: new Date().toISOString(),
      version: options.context.version,
    },
  };

  if (options.pagination) {
    envelope.pagination = options.pagination;
  }

  if (options.links) {
    envelope._links = options.links;
  }

  return Response.json(envelope, {
    headers: {
      "X-Request-Id": options.context.requestId,
      "X-API-Version": options.context.version,
    },
  });
}

function selectFields<T extends Record<string, unknown>>(obj: T, fields: string[]): Partial<T> {
  const result: Partial<T> = {};
  for (const field of fields) {
    if (field in obj) {
      (result as Record<string, unknown>)[field] = obj[field];
    }
  }
  // Always include id and _links
  if ("id" in obj) (result as Record<string, unknown>).id = obj.id;
  if ("_links" in obj) (result as Record<string, unknown>)._links = obj._links;
  return result;
}
```

### 5.14 Pagination Strategies

```typescript
// app/utils/pagination.server.ts

// Offset-based pagination (general use)
interface OffsetPaginationParams {
  page: number;
  pageSize: number;
}

interface OffsetPaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function paginateOffset<T>(
  query: { where: unknown; orderBy: unknown },
  params: OffsetPaginationParams,
  model: { findMany: Function; count: Function },
): Promise<OffsetPaginationResult<T>> {
  const { page, pageSize } = params;
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    model.findMany({
      ...query,
      skip,
      take: pageSize,
    }),
    model.count({ where: query.where }),
  ]);

  return {
    data: data as T[],
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Cursor-based pagination (for real-time feeds and large datasets)
interface CursorPaginationParams {
  cursor?: string; // Last seen item ID
  limit: number;
  direction: "forward" | "backward";
}

interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
  };
}

export async function paginateCursor<T extends { id: string }>(
  query: { where: unknown; orderBy: unknown },
  params: CursorPaginationParams,
  model: { findMany: Function },
): Promise<CursorPaginationResult<T>> {
  const { cursor, limit, direction } = params;

  const data = (await model.findMany({
    ...query,
    take: limit + 1, // Fetch one extra to determine hasMore
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1, // Skip the cursor item itself
        }
      : {}),
  })) as T[];

  const hasMore = data.length > limit;
  if (hasMore) data.pop(); // Remove the extra item

  return {
    data,
    pagination: {
      hasMore,
      nextCursor: data.length > 0 ? data[data.length - 1].id : null,
      prevCursor: cursor ?? null,
    },
  };
}
```

### 5.15 Bulk Operations API Pattern

```typescript
// app/utils/bulk-operations.server.ts

interface BulkOperation<TInput, TResult> {
  id: string;
  input: TInput;
}

interface BulkResult<TResult> {
  results: Array<{
    id: string;
    status: "success" | "error";
    data?: TResult;
    error?: {
      code: string;
      message: string;
    };
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

export async function executeBulk<TInput, TResult>(
  operations: BulkOperation<TInput, TResult>[],
  handler: (op: BulkOperation<TInput, TResult>) => Promise<TResult>,
  options: { maxBatchSize: number; continueOnError: boolean } = {
    maxBatchSize: 100,
    continueOnError: true,
  },
): Promise<BulkResult<TResult>> {
  if (operations.length > options.maxBatchSize) {
    throw new ApiError(400, "BATCH_TOO_LARGE", `Maximum batch size is ${options.maxBatchSize}`);
  }

  const results: BulkResult<TResult>["results"] = [];
  let succeeded = 0;
  let failed = 0;

  for (const op of operations) {
    try {
      const data = await handler(op);
      results.push({ id: op.id, status: "success", data });
      succeeded++;
    } catch (error) {
      failed++;
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred");

      results.push({
        id: op.id,
        status: "error",
        error: { code: apiError.code, message: apiError.message },
      });

      if (!options.continueOnError) break;
    }
  }

  return {
    results,
    summary: { total: operations.length, succeeded, failed },
  };
}
```

### 5.16 Error Handling

```typescript
// app/utils/api-errors.server.ts

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Standard error response format
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
    timestamp: string;
    documentation?: string;
  };
}

export function formatErrorResponse(error: ApiError | Error, requestId: string): Response {
  if (error instanceof ConflictError) {
    const body: ErrorResponse = {
      error: {
        code: "CONFLICT",
        message: error.message,
        details: {
          currentResource: error.currentResource,
        },
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
    return Response.json(body, { status: 409 });
  }

  if (error instanceof ApiError) {
    const body: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
        timestamp: new Date().toISOString(),
        documentation: `https://docs.example.com/errors/${error.code}`,
      },
    };
    return Response.json(body, { status: error.statusCode });
  }

  // Unexpected errors -- do not leak internals
  const body: ErrorResponse = {
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
  return Response.json(body, { status: 500 });
}

// Error code catalog (see Appendix D for full list)
export const ERROR_CODES = {
  // Authentication (401)
  MISSING_API_KEY: "X-API-Key header is required",
  INVALID_API_KEY: "The provided API key is invalid",
  EXPIRED_API_KEY: "The API key has expired",
  REVOKED_API_KEY: "The API key has been revoked",

  // Authorization (403)
  INSUFFICIENT_PERMISSIONS: "API key lacks required permissions",
  SCOPE_VIOLATION: "Resource not within API key scope",
  TENANT_MISMATCH: "Resource belongs to a different tenant",
  IP_NOT_ALLOWED: "Request IP not in API key allowlist",

  // Validation (400)
  VALIDATION_ERROR: "Request validation failed",
  INVALID_JSON: "Request body is not valid JSON",
  MISSING_REQUIRED_FIELD: "A required field is missing",

  // Conflict (409)
  CONFLICT: "Resource was modified by another user",
  DUPLICATE_RESOURCE: "A resource with the same key already exists",

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded",

  // Not Found (404)
  NOT_FOUND: "Resource not found",

  // Server (500)
  INTERNAL_ERROR: "An unexpected error occurred",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
} as const;
```

---

## 6. User Interface

### 6.1 API Key Management Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  API Keys                                              [+ Create]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Name                  Prefix      Permissions   Status  Used │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  Production CRM        ak_live_    5 perms      ACTIVE  15.2k│  │
│  │  Staging Test          ak_live_    3 perms      ACTIVE  1.3k │  │
│  │  Old Integration       ak_live_    2 perms      ROTATED 0    │  │
│  │  Deprecated Key        ak_live_    5 perms      REVOKED --   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─── Create API Key ───────────────────────────────────────────┐  │
│  │  Name:         [Production CRM Integration        ]          │  │
│  │  Description:  [Used by Salesforce sync            ]          │  │
│  │                                                              │  │
│  │  Permissions:                                                │  │
│  │    [x] events:read      [ ] events:write                    │  │
│  │    [x] participants:read [x] participants:write              │  │
│  │    [ ] participants:approve  [ ] participants:reject         │  │
│  │    [ ] webhooks:read    [ ] webhooks:write                  │  │
│  │    [ ] analytics:read   [ ] fields:read              │  │
│  │                                                              │  │
│  │  Rate Limit:   [STANDARD ▼]                                  │  │
│  │  Expires:      [2027-01-01      ] (optional)                 │  │
│  │  IP Allowlist: [203.0.113.0/24  ] (optional)                 │  │
│  │                                                              │  │
│  │  Scope to Events:                                            │  │
│  │    [x] Annual Conference 2026 (evt_abc123)                   │  │
│  │    [ ] Regional Meeting Q1 (evt_def456)                      │  │
│  │                                                              │  │
│  │                           [Cancel]  [Create Key]             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─── Usage Chart (Last 30 Days) ───────────────────────────────┐  │
│  │                                                              │  │
│  │  Requests │  ▂▃▅▇█▇▅▃▃▅▇█▇▅▃▂▃▅▇█▇▅▃▃▅▇█▇▅                │  │
│  │           │──────────────────────────────────────             │  │
│  │           └─── Feb 1 ─── Feb 8 ─── Feb 15 ─── Feb 22        │  │
│  │                                                              │  │
│  │  Total: 15,234  │  Avg/day: 507  │  Errors: 12 (0.08%)      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─── Rotation ─────────────────────────────────────────────────┐  │
│  │  Key: Production CRM (ak_live_)                              │  │
│  │                                                              │  │
│  │  Grace Period: [24] hours                                    │  │
│  │                                                              │  │
│  │  During the grace period, both old and new keys will work.   │  │
│  │  After grace period, the old key is automatically expired.   │  │
│  │                                                              │  │
│  │                          [Cancel]  [Rotate Key]              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Webhook Management Console

```
┌─────────────────────────────────────────────────────────────────────┐
│  Webhooks                                              [+ Create]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  URL                          Events  Status   Delivery Rate  │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  https://crm.example.com/wh  3       ACTIVE   99.2%          │  │
│  │  https://erp.example.com/cb  5       ACTIVE   95.8%          │  │
│  │  https://old.example.com/wh  2       DISABLED 0%   [!]       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [!] Circuit breaker open: 10 consecutive failures.                 │
│      Auto-reset at: 2026-02-11 11:30 UTC  [Reset Now] [Pause]      │
│                                                                     │
│  ┌─── Delivery Log: CRM Integration ───────────────────────────┐   │
│  │  Filter: [All Events ▼] [All Statuses ▼] [Last 24h ▼]       │   │
│  │                                                              │   │
│  │  Time        Event                   Status    Latency Code  │   │
│  │  10:05:23    participant.registered   DELIVERED  145ms  200  │   │
│  │  10:04:15    participant.approved     DELIVERED  230ms  200  │   │
│  │  10:03:02    participant.registered   DELIVERED  189ms  200  │   │
│  │  10:01:45    workflow.step.completed  RETRYING   --     503  │   │
│  │  09:58:30    participant.rejected     DELIVERED  167ms  200  │   │
│  │                                                              │   │
│  │  Showing 1-20 of 1,234 deliveries    [< Prev] [Next >]      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─── Test Webhook ─────────────────────────────────────────────┐  │
│  │  Endpoint: https://crm.example.com/webhooks                  │  │
│  │  Event:    [participant.registered ▼]                        │  │
│  │                                                              │  │
│  │  [Send Test]                                                 │  │
│  │                                                              │  │
│  │  Result: 200 OK  (230ms)                                     │  │
│  │  Response: {"received": true}                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 SSE Connection Monitor

```
┌─────────────────────────────────────────────────────────────────────┐
│  SSE Connections                                     [Refresh 5s]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Summary                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Active: 127 │  │  Users: 89   │  │  Channels: 14           │  │
│  │  ● Healthy   │  │              │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
│  ┌─── Connections by Channel ───────────────────────────────────┐  │
│  │                                                              │  │
│  │  Channel                          Subscribers    Health      │  │
│  │  validator-queue                  34             ● OK        │  │
│  │  participant-status:evt_abc123    45             ● OK        │  │
│  │  participant-status:evt_def456    12             ● OK        │  │
│  │  notifications:*                  89             ● OK        │  │
│  │  sla-alerts                       8              ● OK        │  │
│  │  badge-printer-queue              6              ● OK        │  │
│  │  dispatch-queue                   4              ● OK        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─── Server Instances ─────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  Instance          Connections    Memory     CPU    Status   │  │
│  │  node-pod-a1b2c    64             245 MB     12%    ● OK     │  │
│  │  node-pod-d3e4f    63             238 MB     11%    ● OK     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.4 API Usage Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  API Usage Analytics                    [Last 24h ▼] [Export CSV]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─── Requests per Second ──────────────────────────────────────┐  │
│  │           ▂                                                  │  │
│  │  req/s │ ▃█▅    ▂▃▅▇█▅▃   ▂▃     ▂▃▅▇█▅▃                   │  │
│  │   50   │▅██▇▅▃▂▃▅█████▇▅▃▅█▇▅▃▂▃▅████████▅▃                │  │
│  │        │███████████████████████████████████████               │  │
│  │     0  └──── 00:00 ──── 06:00 ──── 12:00 ──── 18:00         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐  │
│  │  Total    │  │ Error Rate│  │  p50      │  │  p95          │  │
│  │  45,230   │  │  0.3%     │  │  45ms     │  │  180ms        │  │
│  │  requests │  │           │  │  latency  │  │  latency      │  │
│  └───────────┘  └───────────┘  └───────────┘  └───────────────┘  │
│                                                                     │
│  ┌─── Top Consumers ────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  API Key                    Requests   Errors   Avg Latency  │  │
│  │  Production CRM (ak_live_)  12,450    15       52ms         │  │
│  │  Staging Test (ak_live_)    8,320     120      145ms        │  │
│  │  Mobile App (ak_live_)      5,100     3        38ms         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─── Endpoint Breakdown ───────────────────────────────────────┐  │
│  │                                                              │  │
│  │  Endpoint                          Calls   p50    p95   Err  │  │
│  │  GET  /events/:id/participants     15,200  35ms   120ms 0.1% │  │
│  │  POST /events/:id/participants     8,400   85ms   250ms 0.5% │  │
│  │  GET  /events                      6,300   25ms   90ms  0.0% │  │
│  │  POST /events/:id/.../approve      3,200   110ms  300ms 0.2% │  │
│  │  GET  /events/:id/stats            2,100   45ms   150ms 0.0% │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─── Error Distribution ───────────────────────────────────────┐  │
│  │                                                              │  │
│  │  ████████████████████  401 Unauthorized       45%            │  │
│  │  ███████████           429 Rate Limited        25%           │  │
│  │  ██████                400 Validation           15%          │  │
│  │  ████                  409 Conflict             10%          │  │
│  │  ██                    500 Internal              5%          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Integration Points

### 7.1 Internal Event Catalog

Every module publishes and subscribes to domain events through the internal event bus. The following table maps each event to its publisher, subscribers, and payload summary.

| Event Name                       | Publisher Module               | Subscriber Modules                           | Payload                                                   |
| -------------------------------- | ------------------------------ | -------------------------------------------- | --------------------------------------------------------- |
| `participant.registered`         | Registration (Module 09)       | Notification, Webhook, Analytics, SSE        | `{ participantId, eventId, email, name }`                 |
| `participant.approved`           | Workflow Engine (Module 04)    | Notification, Webhook, Analytics, SSE, Badge | `{ participantId, eventId, approvedBy, comment }`         |
| `participant.rejected`           | Workflow Engine (Module 04)    | Notification, Webhook, Analytics, SSE        | `{ participantId, eventId, rejectedBy, reason }`          |
| `participant.printed`            | Badge Service (Module 12)      | Notification, Webhook, Analytics, SSE        | `{ participantId, eventId, badgeId, printedBy }`          |
| `participant.collected`          | Badge Service (Module 12)      | Notification, Webhook, Analytics, SSE        | `{ participantId, eventId, badgeId, collectedAt }`        |
| `workflow.step.completed`        | Workflow Engine (Module 04)    | Webhook, Analytics, SSE, SLA Monitor         | `{ workflowInstanceId, participantId, stepId, action }`   |
| `workflow.sla.breached`          | SLA Monitor (Module 04)        | Notification, Webhook, Analytics, SSE        | `{ workflowInstanceId, participantId, stepId, slaHours }` |
| `badge.printed`                  | Badge Service (Module 12)      | Analytics, SSE                               | `{ badgeId, participantId, eventId, printedBy }`          |
| `badge.collected`                | Check-in Service (Module 14)   | Analytics, SSE                               | `{ badgeId, participantId, eventId }`                     |
| `checkin.scanned`                | Check-in Service (Module 14)   | Analytics, SSE, Occupancy                    | `{ participantId, eventId, checkpointId }`                |
| `delegation.quota.warning`       | Delegation Service (Module 10) | Notification, SSE                            | `{ delegationId, eventId, quotaUsedPercent }`             |
| `api_key.created`                | API Key Service (Module 07)    | Audit Logger                                 | `{ apiKeyId, name, createdBy }`                           |
| `api_key.rotated`                | API Key Service (Module 07)    | Audit Logger, Notification                   | `{ oldKeyId, newKeyId, rotatedBy }`                       |
| `api_key.revoked`                | API Key Service (Module 07)    | Audit Logger, Notification                   | `{ apiKeyId, revokedBy }`                                 |
| `webhook.circuit_breaker.opened` | Webhook Delivery (Module 07)   | Notification, Audit Logger                   | `{ subscriptionId, consecutiveFailures }`                 |

### 7.2 Webhook Event Catalog with Payloads

Each webhook event is delivered as a JSON payload with a consistent envelope:

```typescript
// Webhook delivery envelope
interface WebhookDeliveryPayload {
  id: string; // Unique delivery ID (for idempotency)
  type: string; // Event type
  timestamp: string; // ISO 8601 when event occurred
  tenantId: string; // Originating tenant
  apiVersion: string; // Payload schema version
  data: Record<string, unknown>; // Event-specific payload
}
```

**Event: `participant.registered`**

```json
{
  "id": "evt_del_abc123",
  "type": "participant.registered",
  "timestamp": "2026-02-11T10:00:00Z",
  "tenantId": "tenant_xyz",
  "apiVersion": "v1",
  "data": {
    "participantId": "prt_abc123",
    "eventId": "evt_abc123",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "organization": "Acme Corp",
    "status": "REGISTERED",
    "registeredAt": "2026-02-11T10:00:00Z"
  }
}
```

**Event: `participant.approved`**

```json
{
  "id": "evt_del_def456",
  "type": "participant.approved",
  "timestamp": "2026-02-11T14:30:00Z",
  "tenantId": "tenant_xyz",
  "apiVersion": "v1",
  "data": {
    "participantId": "prt_abc123",
    "eventId": "evt_abc123",
    "status": "APPROVED",
    "approvedBy": {
      "userId": "user_xyz",
      "name": "Admin User"
    },
    "comment": "Documents verified",
    "approvedAt": "2026-02-11T14:30:00Z"
  }
}
```

**Event: `participant.rejected`**

```json
{
  "id": "evt_del_ghi789",
  "type": "participant.rejected",
  "timestamp": "2026-02-11T15:00:00Z",
  "tenantId": "tenant_xyz",
  "apiVersion": "v1",
  "data": {
    "participantId": "prt_def456",
    "eventId": "evt_abc123",
    "status": "REJECTED",
    "rejectedBy": {
      "userId": "user_xyz",
      "name": "Admin User"
    },
    "reason": "Incomplete documentation",
    "rejectedAt": "2026-02-11T15:00:00Z"
  }
}
```

**Event: `participant.printed`**

```json
{
  "id": "evt_del_jkl012",
  "type": "participant.printed",
  "timestamp": "2026-02-11T16:00:00Z",
  "tenantId": "tenant_xyz",
  "apiVersion": "v1",
  "data": {
    "participantId": "prt_abc123",
    "eventId": "evt_abc123",
    "badgeId": "bdg_abc123",
    "status": "PRINTED",
    "printedBy": {
      "userId": "user_printer",
      "name": "Printer Operator"
    },
    "printedAt": "2026-02-11T16:00:00Z"
  }
}
```

**Event: `participant.collected`**

```json
{
  "id": "evt_del_mno345",
  "type": "participant.collected",
  "timestamp": "2026-02-11T17:00:00Z",
  "tenantId": "tenant_xyz",
  "apiVersion": "v1",
  "data": {
    "participantId": "prt_abc123",
    "eventId": "evt_abc123",
    "badgeId": "bdg_abc123",
    "status": "COLLECTED",
    "collectedAt": "2026-02-11T17:00:00Z"
  }
}
```

**Event: `workflow.step.completed`**

```json
{
  "id": "evt_del_pqr678",
  "type": "workflow.step.completed",
  "timestamp": "2026-02-11T14:30:00Z",
  "tenantId": "tenant_xyz",
  "apiVersion": "v1",
  "data": {
    "workflowInstanceId": "wfi_abc123",
    "participantId": "prt_abc123",
    "eventId": "evt_abc123",
    "step": {
      "id": "step_doc_review",
      "name": "Document Review",
      "order": 1
    },
    "action": "approve",
    "performedBy": {
      "userId": "user_xyz",
      "name": "Reviewer"
    },
    "nextStep": {
      "id": "step_mgr_approval",
      "name": "Manager Approval",
      "order": 2
    }
  }
}
```

**Event: `workflow.sla.breached`**

```json
{
  "id": "evt_del_stu901",
  "type": "workflow.sla.breached",
  "timestamp": "2026-02-11T20:00:00Z",
  "tenantId": "tenant_xyz",
  "apiVersion": "v1",
  "data": {
    "workflowInstanceId": "wfi_def456",
    "participantId": "prt_def456",
    "eventId": "evt_abc123",
    "step": {
      "id": "step_doc_review",
      "name": "Document Review"
    },
    "slaHours": 4,
    "actualHours": 6.5,
    "severity": "WARNING"
  }
}
```

### 7.3 SSE Channel Catalog

| Channel Pattern                | Description                              | Subscribed Roles           | Event Types                              |
| ------------------------------ | ---------------------------------------- | -------------------------- | ---------------------------------------- |
| `validator-queue`              | Queue count updates for validation steps | Validator, Reviewer        | `queue-update`, `assignment-changed`     |
| `participant-status:{eventId}` | Participant status changes for an event  | Event Manager, Coordinator | `participant-updated`, `status-changed`  |
| `notifications:{userId}`       | Personal notification feed               | All authenticated users    | `notification-new`, `notification-read`  |
| `sla-alerts`                   | SLA breach and warning alerts            | Supervisor, Event Manager  | `sla-breach`, `sla-warning`              |
| `badge-printer-queue`          | Badge print queue updates                | Printer Operator           | `print-job-added`, `print-job-completed` |
| `dispatch-queue`               | Badge dispatch/collection queue          | Dispatcher                 | `dispatch-ready`, `badge-collected`      |
| `checkin-feed:{eventId}`       | Live check-in activity feed              | Security, Event Manager    | `checkin-scanned`, `occupancy-update`    |
| `analytics:{eventId}`          | Real-time analytics updates              | Event Manager, Admin       | `metric-update`, `snapshot-ready`        |

---

## 8. Configuration

### 8.1 API Rate Limits

```typescript
// app/config/rate-limits.ts
export const rateLimitConfig = {
  tiers: {
    STANDARD: {
      requests: 100,
      windowMs: 60_000, // 1 minute
      burstAllowance: 10, // Extra requests allowed in burst
    },
    ELEVATED: {
      requests: 500,
      windowMs: 60_000,
      burstAllowance: 50,
    },
    PREMIUM: {
      requests: 2000,
      windowMs: 60_000,
      burstAllowance: 200,
    },
  },

  endpointOverrides: {
    // Auth endpoints have stricter limits
    "POST /api/v1/api-keys": { requests: 10, windowMs: 60_000 },
    "POST /api/v1/api-keys/:id/rotate": { requests: 5, windowMs: 60_000 },
    "POST /api/v1/api-keys/:id/revoke": { requests: 5, windowMs: 60_000 },

    // Mutation endpoints
    "POST /api/v1/events/:id/participants": { requests: 50, windowMs: 60_000 },
    "POST /api/v1/events/:id/participants/:id/approve": { requests: 50, windowMs: 60_000 },

    // Bulk operations
    "POST /api/v1/events/:id/workflow/batch": { requests: 10, windowMs: 60_000 },
  },

  // Global fallback (no API key)
  anonymous: {
    requests: 10,
    windowMs: 60_000,
  },

  // Response headers
  headers: {
    limit: "X-RateLimit-Limit",
    remaining: "X-RateLimit-Remaining",
    reset: "X-RateLimit-Reset",
    retryAfter: "Retry-After",
  },
};
```

### 8.2 Webhook Retry Policies

```typescript
// app/config/webhook.ts
export const webhookConfig = {
  delivery: {
    defaultTimeoutMs: 10_000, // 10 seconds
    maxTimeoutMs: 30_000, // 30 seconds
    maxPayloadSizeBytes: 256_000, // 256 KB

    retryDelaysMs: [
      1_000, // 1 second
      5_000, // 5 seconds
      30_000, // 30 seconds
      300_000, // 5 minutes
      1_800_000, // 30 minutes
    ],
    maxRetries: 5,
  },

  circuitBreaker: {
    failureThreshold: 10, // Consecutive failures to open
    resetTimeMs: 30 * 60 * 1000, // 30 minutes
    halfOpenMaxAttempts: 1, // Attempts in half-open state
  },

  retryQueue: {
    pollIntervalMs: 10_000, // Check for retries every 10s
    batchSize: 50, // Process 50 retries per cycle
    maxConcurrentDeliveries: 10, // Parallel deliveries
  },

  deadLetter: {
    retentionDays: 30, // Keep dead letters for 30 days
    maxPerSubscription: 1000, // Max dead letters per subscription
  },

  subscriptions: {
    maxPerTenant: 50, // Max webhook subscriptions
    maxEventsPerSubscription: 20, // Max event types per subscription
    urlRequireHttps: true, // Require HTTPS endpoints
  },
};
```

### 8.3 SSE Configuration

```typescript
// app/config/sse.ts
export const sseConfig = {
  connection: {
    heartbeatIntervalMs: 30_000, // Keepalive every 30 seconds
    staleConnectionTimeoutMs: 5 * 60_000, // Remove after 5 min no heartbeat
    maxConnectionsPerUser: 5, // Prevent connection floods
    maxConnectionsTotal: 1000, // Server-wide limit
    reconnectAdviceMs: 3_000, // Suggest reconnect delay to client
  },

  replay: {
    maxReplayEvents: 100, // Max events replayed on reconnect
    maxReplayAgeMs: 30 * 60_000, // Only replay events < 30 min old
  },

  channels: {
    maxChannelsPerConnection: 10, // Max channels per SSE connection
    maxSubscribersPerChannel: 500, // Max subscribers per channel
  },

  monitoring: {
    statsIntervalMs: 60_000, // Report stats every minute
    reaperIntervalMs: 60_000, // Check for stale connections
  },
};
```

### 8.4 API Versioning Settings

```typescript
// app/config/api-versioning.ts
export const apiVersionConfig = {
  currentVersion: "v1",
  supportedVersions: ["v1"],
  deprecatedVersions: [],

  // Sunset policy
  sunsetPolicy: {
    warningMonths: 6, // Warn 6 months before sunset
    graceMonths: 12, // Keep alive 12 months after successor
  },

  // Version header
  headers: {
    version: "X-API-Version",
    deprecation: "X-Deprecation",
    sunset: "Sunset", // RFC 8594
  },
};
```

### 8.5 CORS Configuration

```typescript
// app/config/cors.ts
export const corsConfig = {
  // Default CORS policy
  defaults: {
    allowedOrigins: ["*"], // Overridden per tenant
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Request-Id", "If-Match"],
    exposedHeaders: [
      "X-Request-Id",
      "X-API-Version",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
      "Retry-After",
      "ETag",
    ],
    maxAge: 86400, // Preflight cache: 24 hours
    credentials: false, // API keys, not cookies
  },

  // Per-tenant overrides stored in tenant config
  // tenant.apiConfig.cors.allowedOrigins = ['https://app.example.com']
};
```

### 8.6 Request and Response Limits

```typescript
// app/config/request-limits.ts
export const requestLimitsConfig = {
  request: {
    maxBodySizeBytes: 1_048_576, // 1 MB
    maxUrlLength: 2048, // 2 KB
    maxHeaderSize: 8192, // 8 KB
    requestTimeoutMs: 30_000, // 30 seconds
  },

  response: {
    compression: {
      enabled: true,
      algorithms: ["gzip", "br"], // gzip and brotli
      minSizeBytes: 1024, // Only compress > 1 KB
    },
  },

  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxTotalResults: 10_000, // Hard limit on total queryable
    defaultSort: "createdAt",
    defaultOrder: "desc" as const,
  },

  bulkOperations: {
    maxBatchSize: 100, // Max items per bulk request
    maxConcurrent: 10, // Parallel processing within batch
  },

  fieldSelection: {
    maxFields: 50, // Max fields in ?fields=
    maxIncludes: 10, // Max relations in ?include=
  },
};
```

---

## 9. Testing Strategy

### 9.1 API Contract Tests

Every endpoint is tested with valid and invalid inputs to verify request validation, response schemas, and error handling.

```typescript
// tests/api/participants.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApiKey, createTestEvent } from "../helpers";

describe("POST /api/v1/events/:eventId/participants", () => {
  let apiKey: string;
  let eventId: string;

  beforeAll(async () => {
    const key = await createTestApiKey({
      permissions: ["participants:write", "participants:read"],
    });
    apiKey = key.apiKey;
    eventId = (await createTestEvent()).id;
  });

  it("should register a participant with valid data", async () => {
    const response = await fetch(`${BASE_URL}/api/v1/events/${eventId}/participants`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        organization: "Acme Corp",
      }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data).toMatchObject({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      status: "REGISTERED",
    });
    expect(body.data.id).toBeDefined();
    expect(body.data._links.self).toBeDefined();
  });

  it("should reject missing required fields", async () => {
    const response = await fetch(`${BASE_URL}/api/v1/events/${eventId}/participants`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firstName: "Jane" }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toContainEqual(expect.objectContaining({ field: "body.lastName" }));
    expect(body.error.details).toContainEqual(expect.objectContaining({ field: "body.email" }));
  });

  it("should reject invalid email format", async () => {
    const response = await fetch(`${BASE_URL}/api/v1/events/${eventId}/participants`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Smith",
        email: "not-an-email",
      }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.details).toContainEqual(expect.objectContaining({ field: "body.email" }));
  });

  it("should reject duplicate email for same event", async () => {
    // First registration
    await fetch(`${BASE_URL}/api/v1/events/${eventId}/participants`, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Smith",
        email: "duplicate@example.com",
      }),
    });

    // Duplicate registration
    const response = await fetch(`${BASE_URL}/api/v1/events/${eventId}/participants`, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Doe",
        email: "duplicate@example.com",
      }),
    });

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("DUPLICATE_RESOURCE");
  });

  it("should require valid API key", async () => {
    const response = await fetch(`${BASE_URL}/api/v1/events/${eventId}/participants`, {
      method: "POST",
      headers: {
        "X-API-Key": "invalid_key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
      }),
    });

    expect(response.status).toBe(401);
  });

  it("should enforce permission checks", async () => {
    const readOnlyKey = await createTestApiKey({
      permissions: ["participants:read"], // No write permission
    });

    const response = await fetch(`${BASE_URL}/api/v1/events/${eventId}/participants`, {
      method: "POST",
      headers: {
        "X-API-Key": readOnlyKey.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
      }),
    });

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("INSUFFICIENT_PERMISSIONS");
  });
});
```

### 9.2 Webhook Delivery Tests

```typescript
// tests/webhooks/delivery.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { createMockWebhookEndpoint } from "../helpers/mock-server";

describe("Webhook Delivery Engine", () => {
  let mockEndpoint: ReturnType<typeof createMockWebhookEndpoint>;

  beforeAll(() => {
    mockEndpoint = createMockWebhookEndpoint();
  });

  it("should deliver webhook with correct HMAC signature", async () => {
    const subscription = await createTestWebhookSubscription({
      url: mockEndpoint.url,
      events: ["participant.registered"],
    });

    // Trigger event
    await triggerParticipantRegistration();

    // Verify delivery
    const delivery = await mockEndpoint.waitForRequest(5000);
    expect(delivery.headers["x-webhook-signature"]).toBeDefined();

    // Verify HMAC
    const expectedSignature = generateWebhookSignature(delivery.body, subscription.secret);
    expect(delivery.headers["x-webhook-signature"]).toBe(expectedSignature);
  });

  it("should retry on 5xx errors with exponential backoff", async () => {
    mockEndpoint.setResponseSequence([
      { status: 503 }, // 1st attempt fails
      { status: 503 }, // 2nd attempt fails
      { status: 200 }, // 3rd attempt succeeds
    ]);

    await triggerParticipantRegistration();

    // Wait for retries
    const requests = await mockEndpoint.waitForRequests(3, 60_000);
    expect(requests).toHaveLength(3);

    // Verify exponential backoff timing
    const timeBetween1and2 = requests[1].timestamp - requests[0].timestamp;
    const timeBetween2and3 = requests[2].timestamp - requests[1].timestamp;
    expect(timeBetween1and2).toBeGreaterThanOrEqual(900); // ~1s
    expect(timeBetween2and3).toBeGreaterThanOrEqual(4500); // ~5s
  });

  it("should move to dead letter after exhausting retries", async () => {
    mockEndpoint.setResponseSequence([
      { status: 503 },
      { status: 503 },
      { status: 503 },
      { status: 503 },
      { status: 503 }, // 5 failures
    ]);

    await triggerParticipantRegistration();

    // Wait for all retries to complete
    await waitFor(async () => {
      const delivery = await prisma.webhookDelivery.findFirst({
        where: { status: "DEAD_LETTER" },
      });
      return delivery !== null;
    }, 120_000);

    const deadLetter = await prisma.webhookDelivery.findFirst({
      where: { status: "DEAD_LETTER" },
    });
    expect(deadLetter).toBeDefined();
    expect(deadLetter!.attempts).toBe(5);
  });

  it("should open circuit breaker after threshold failures", async () => {
    mockEndpoint.alwaysReturn({ status: 503 });

    // Trigger enough events to hit threshold
    for (let i = 0; i < 12; i++) {
      await triggerParticipantRegistration();
    }

    // Wait for circuit breaker to open
    await waitFor(async () => {
      const sub = await prisma.webhookSubscription.findFirst({
        where: { circuitBreakerOpen: true },
      });
      return sub !== null;
    }, 120_000);

    const subscription = await prisma.webhookSubscription.findFirst({
      where: { circuitBreakerOpen: true },
    });
    expect(subscription!.status).toBe("DISABLED");
  });
});
```

### 9.3 SSE Reconnection Tests

```typescript
// tests/sse/reconnection.test.ts
import { describe, it, expect } from "vitest";
import EventSource from "eventsource";

describe("SSE Reconnection", () => {
  it("should reconnect with Last-Event-ID and replay missed events", async () => {
    const receivedEvents: string[] = [];
    let lastEventId: string | null = null;

    // Initial connection
    const es1 = new EventSource(`${BASE_URL}/api/v1/sse/validator-queue`, {
      headers: { "X-API-Key": testApiKey },
    });

    es1.addEventListener("queue-update", (event) => {
      receivedEvents.push(event.data);
      lastEventId = event.lastEventId;
    });

    // Wait for some events
    await waitFor(() => receivedEvents.length >= 3, 15_000);
    es1.close();

    // Trigger events while disconnected
    await triggerQueueUpdate();
    await triggerQueueUpdate();

    // Reconnect with Last-Event-ID
    const es2 = new EventSource(`${BASE_URL}/api/v1/sse/validator-queue`, {
      headers: {
        "X-API-Key": testApiKey,
        "Last-Event-ID": lastEventId!,
      },
    });

    const replayedEvents: string[] = [];
    es2.addEventListener("queue-update", (event) => {
      replayedEvents.push(event.data);
    });

    // Should receive the missed events
    await waitFor(() => replayedEvents.length >= 2, 10_000);
    expect(replayedEvents.length).toBeGreaterThanOrEqual(2);
    es2.close();
  });

  it("should receive heartbeat every 30 seconds", async () => {
    const heartbeats: Date[] = [];

    const es = new EventSource(`${BASE_URL}/api/v1/sse/validator-queue`, {
      headers: { "X-API-Key": testApiKey },
    });

    es.addEventListener("heartbeat", () => {
      heartbeats.push(new Date());
    });

    // Wait for 2 heartbeats
    await waitFor(() => heartbeats.length >= 2, 70_000);
    const gap = heartbeats[1].getTime() - heartbeats[0].getTime();
    expect(gap).toBeGreaterThanOrEqual(28_000); // ~30s with tolerance
    expect(gap).toBeLessThanOrEqual(35_000);
    es.close();
  });
});
```

### 9.4 Rate Limiting Tests

```typescript
// tests/api/rate-limiting.test.ts
import { describe, it, expect } from "vitest";

describe("Rate Limiting", () => {
  it("should enforce rate limits on burst traffic", async () => {
    const apiKey = await createTestApiKey({
      permissions: ["events:read"],
      rateLimitTier: "STANDARD", // 100/min
    });

    // Send 110 requests rapidly
    const responses = await Promise.all(
      Array.from({ length: 110 }, () =>
        fetch(`${BASE_URL}/api/v1/events`, {
          headers: { "X-API-Key": apiKey.apiKey },
        }),
      ),
    );

    const successCount = responses.filter((r) => r.status === 200).length;
    const rateLimitedCount = responses.filter((r) => r.status === 429).length;

    // Should allow ~100-110 (with burst allowance) then rate limit
    expect(successCount).toBeGreaterThanOrEqual(100);
    expect(rateLimitedCount).toBeGreaterThan(0);

    // Verify rate limit headers
    const rateLimitedResponse = responses.find((r) => r.status === 429)!;
    expect(rateLimitedResponse.headers.get("Retry-After")).toBeDefined();
    expect(rateLimitedResponse.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("should enforce per-key custom rate limits", async () => {
    const apiKey = await createTestApiKey({
      permissions: ["events:read"],
      rateLimitTier: "CUSTOM",
      rateLimitCustom: 10, // Only 10/min
    });

    const responses = await Promise.all(
      Array.from({ length: 15 }, () =>
        fetch(`${BASE_URL}/api/v1/events`, {
          headers: { "X-API-Key": apiKey.apiKey },
        }),
      ),
    );

    const rateLimitedCount = responses.filter((r) => r.status === 429).length;
    expect(rateLimitedCount).toBeGreaterThanOrEqual(4);
  });

  it("should reset rate limit window after timeout", async () => {
    const apiKey = await createTestApiKey({
      permissions: ["events:read"],
      rateLimitTier: "CUSTOM",
      rateLimitCustom: 5,
    });

    // Exhaust rate limit
    await Promise.all(
      Array.from({ length: 10 }, () =>
        fetch(`${BASE_URL}/api/v1/events`, {
          headers: { "X-API-Key": apiKey.apiKey },
        }),
      ),
    );

    // Wait for window to reset
    await new Promise((resolve) => setTimeout(resolve, 61_000));

    // Should work again
    const response = await fetch(`${BASE_URL}/api/v1/events`, {
      headers: { "X-API-Key": apiKey.apiKey },
    });
    expect(response.status).toBe(200);
  });
});
```

### 9.5 Load Tests

```typescript
// tests/load/api-load.test.ts
import { describe, it, expect } from "vitest";

describe("API Load Tests", () => {
  it("should handle 100 concurrent API requests within latency targets", async () => {
    const apiKey = await createTestApiKey({
      permissions: ["events:read", "participants:read"],
      rateLimitTier: "PREMIUM",
    });

    const startTime = Date.now();

    const responses = await Promise.all(
      Array.from({ length: 100 }, () =>
        fetch(`${BASE_URL}/api/v1/events`, {
          headers: { "X-API-Key": apiKey.apiKey },
        }).then(async (r) => ({
          status: r.status,
          latency: Date.now() - startTime,
        })),
      ),
    );

    const successRate = responses.filter((r) => r.status === 200).length / 100;
    const latencies = responses.map((r) => r.latency).sort((a, b) => a - b);
    const p50 = latencies[49];
    const p95 = latencies[94];
    const p99 = latencies[98];

    expect(successRate).toBeGreaterThanOrEqual(0.95);
    expect(p50).toBeLessThan(200); // p50 < 200ms under load
    expect(p95).toBeLessThan(500); // p95 < 500ms under load
    expect(p99).toBeLessThan(1000); // p99 < 1s under load
  });

  it("should handle 50 concurrent SSE connections", async () => {
    const connections: EventSource[] = [];

    for (let i = 0; i < 50; i++) {
      const es = new EventSource(`${BASE_URL}/api/v1/sse/validator-queue`, {
        headers: { "X-API-Key": testApiKey },
      });
      connections.push(es);
    }

    // Wait for all connections to establish
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify SSE manager stats
    const statsResponse = await fetch(`${BASE_URL}/api/v1/admin/sse/stats`, {
      headers: { "X-API-Key": adminApiKey },
    });
    const stats = await statsResponse.json();
    expect(stats.data.totalConnections).toBeGreaterThanOrEqual(50);

    // Cleanup
    connections.forEach((es) => es.close());
  });
});
```

---

## 10. Security Considerations

### 10.1 API Key Security

| Concern               | Mitigation                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Key storage**       | API keys are hashed with bcrypt (12 rounds) before storage. Plain-text keys are returned only once at creation and never stored.                          |
| **Key prefixing**     | All keys use `ak_live_` prefix for identification in logs and dashboards without exposing the full key.                                                   |
| **Key rotation**      | Rotation creates a new key and places the old key in a configurable grace period (default 24h). After grace period, the old key is automatically expired. |
| **Key revocation**    | Revoked keys are immediately invalidated from the in-memory cache and marked in the database.                                                             |
| **Expiration**        | Optional expiry date. Expired keys return `401 EXPIRED_API_KEY`.                                                                                          |
| **Scope restriction** | Keys can be scoped to specific events, limiting blast radius if compromised.                                                                              |
| **IP allowlisting**   | Optional IP allowlist. Requests from non-allowed IPs return `403 IP_NOT_ALLOWED`.                                                                         |

### 10.2 Webhook Signature Verification

Webhook payloads are signed using HMAC-SHA256. Receivers should verify signatures as follows:

```typescript
// Example: Webhook signature verification (consumer-side)
import crypto from "crypto";

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  const expectedSignature = `sha256=${expected}`;

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Usage in an Express webhook handler
app.post("/webhooks/accreditation", (req, res) => {
  const signature = req.headers["x-webhook-signature"] as string;
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Process the webhook event
  const event = req.body;
  console.log(`Received: ${event.type}`, event.data);

  res.status(200).json({ received: true });
});
```

### 10.3 CORS Policy

- CORS origins are configurable per tenant via tenant settings.
- Default policy allows all origins (for API-key-authenticated requests, CORS is less critical since credentials are in headers, not cookies).
- Per-API-key `allowedOrigins` provides fine-grained origin control.
- Preflight responses are cached for 24 hours to minimize OPTIONS requests.

### 10.4 Request Signing

For outbound requests to external services (e.g., webhook deliveries), the platform includes:

- `X-Webhook-Id` -- Unique delivery ID for tracking.
- `X-Webhook-Timestamp` -- ISO 8601 timestamp of the request.
- `X-Webhook-Signature` -- HMAC-SHA256 signature of the payload body using the shared secret.

Consumers can use the timestamp to reject stale webhooks (recommended: reject if timestamp is older than 5 minutes).

### 10.5 IP Allowlisting

```typescript
// app/middleware/ip-allowlist.server.ts
export function checkIpAllowlist(requestIp: string, allowedIps: string[]): boolean {
  if (allowedIps.length === 0) return true; // No restriction

  for (const allowed of allowedIps) {
    if (allowed.includes("/")) {
      // CIDR range check
      if (isIpInCidr(requestIp, allowed)) return true;
    } else {
      // Exact match
      if (requestIp === allowed) return true;
    }
  }

  return false;
}
```

### 10.6 Audit Logging

All API mutations (POST, PUT, DELETE) are logged to an audit trail:

```typescript
// Audit log entry structure
interface ApiAuditEntry {
  id: string;
  tenantId: string;
  apiKeyId: string;
  requestId: string;
  method: string; // POST, PUT, DELETE
  path: string; // /api/v1/events/evt_abc123/participants
  statusCode: number; // 200, 201, 400, etc.
  resourceType: string; // participant, event, webhook
  resourceId: string; // prt_abc123
  action: string; // create, update, delete, approve, reject
  changes?: Record<string, { from: unknown; to: unknown }>;
  ipAddress: string;
  userAgent: string;
  latencyMs: number;
  timestamp: string; // ISO 8601
}
```

### 10.7 Input Sanitization

- All string inputs are trimmed and sanitized against XSS (HTML entities escaped).
- JSON payloads are validated against Zod schemas with strict mode (no unknown keys by default).
- Path parameters and query strings are validated for type and format.
- File uploads (if any) are validated for MIME type and size.
- SQL injection is prevented by Prisma's parameterized queries.

---

## 11. Performance Requirements

### 11.1 API Response Time Targets

| Percentile | Target  | Description                                          |
| ---------- | ------- | ---------------------------------------------------- |
| **p50**    | < 100ms | Median response time for all API requests            |
| **p95**    | < 300ms | 95th percentile -- covers complex queries with joins |
| **p99**    | < 500ms | 99th percentile -- worst-case for bulk operations    |

**Breakdown by operation type:**

| Operation                      | p50 Target                                 | p95 Target |
| ------------------------------ | ------------------------------------------ | ---------- |
| Simple GET (by ID)             | < 30ms                                     | < 80ms     |
| List with pagination           | < 80ms                                     | < 200ms    |
| List with custom field filters | < 150ms                                    | < 400ms    |
| Mutations (create/update)      | < 100ms                                    | < 300ms    |
| Bulk operations (100 items)    | < 2000ms                                   | < 5000ms   |
| Webhook delivery (async)       | N/A (fire-and-forget from API perspective) | N/A        |

### 11.2 SSE Connection Limits

| Metric                                      | Limit                          |
| ------------------------------------------- | ------------------------------ |
| Max concurrent SSE connections (per server) | 1,000                          |
| Max SSE connections per user                | 5                              |
| Max subscribers per channel                 | 500                            |
| Heartbeat interval                          | 30 seconds                     |
| Stale connection timeout                    | 5 minutes                      |
| Event replay on reconnect                   | Max 100 events, max 30 min old |

### 11.3 Webhook Throughput

| Metric                    | Target                      |
| ------------------------- | --------------------------- |
| Deliveries per second     | 100                         |
| Max concurrent deliveries | 10                          |
| Retry queue poll interval | 10 seconds                  |
| Retry batch size          | 50                          |
| Average delivery latency  | < 500ms (network dependent) |

### 11.4 API Key Validation Caching

- In-memory cache with 5-minute TTL for validated API keys.
- Cache invalidation on key rotation or revocation.
- Cache hit rate target: > 95% (most requests use the same key repeatedly).
- Cache size: Bounded to 10,000 entries with LRU eviction.

### 11.5 Response Compression

| Algorithm  | Use Case                              | Minimum Size |
| ---------- | ------------------------------------- | ------------ |
| **gzip**   | Default for all responses             | > 1 KB       |
| **Brotli** | When `Accept-Encoding: br` is present | > 1 KB       |
| **None**   | Responses < 1 KB or SSE streams       | N/A          |

Compression reduces typical API response sizes by 60-80%, significantly improving network transfer times for list endpoints.

---

## 12. Open Questions & Decisions

| #   | Question                                     | Options                                                                                                                                                                    | Status    | Impact                                                                  |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| 1   | **GraphQL vs REST for complex queries**      | (A) Stay with REST + field selection/includes; (B) Add GraphQL for complex querying; (C) Hybrid: REST for CRUD, GraphQL for analytics/reporting                            | OPEN      | Affects frontend complexity, caching strategy, and developer experience |
| 2   | **API versioning sunset policy**             | (A) 12-month grace after successor; (B) 6-month grace; (C) Version forever (no sunset)                                                                                     | LEANING A | Affects maintenance burden and integration stability                    |
| 3   | **Webhook retry limits**                     | (A) 5 retries (current); (B) Configurable per subscription (1-10); (C) Unlimited with exponential backoff cap at 24h                                                       | LEANING B | Affects delivery guarantees and resource usage                          |
| 4   | **SSE vs WebSocket for bidirectional needs** | (A) Stay with SSE (unidirectional) + REST for actions; (B) Migrate to WebSocket for bidirectional; (C) Hybrid: SSE for notifications, WebSocket for collaborative features | LEANING A | Affects infrastructure complexity and real-time capability              |
| 5   | **API marketplace / developer portal**       | (A) Build custom portal; (B) Use third-party (Stoplight, ReadMe); (C) Auto-generate from OpenAPI spec; (D) Defer to future phase                                           | LEANING D | Affects developer onboarding and adoption                               |
| 6   | **Event bus migration to message queue**     | (A) Stay with EventEmitter (single-process); (B) Migrate to BullMQ (Redis); (C) Migrate to RabbitMQ; (D) Migrate to AWS SQS                                                | OPEN      | Affects durability, scaling, and infrastructure cost                    |
| 7   | **API key vs OAuth 2.0 for external auth**   | (A) API keys only (current); (B) Add OAuth 2.0 client credentials; (C) Both with OAuth as primary                                                                          | OPEN      | Affects security model and integration complexity                       |
| 8   | **Rate limit storage**                       | (A) In-memory (current, per-instance); (B) Redis-backed (shared across instances); (C) Database-backed                                                                     | LEANING B | Affects accuracy in multi-instance deployments                          |

---

## Appendix

### A. Glossary

| Term                        | Definition                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **API Key**                 | A tenant-scoped cryptographic token used to authenticate external API requests. Stored as a bcrypt hash.                                       |
| **Circuit Breaker**         | A pattern that stops sending requests to a failing endpoint after a threshold of consecutive failures, allowing recovery time before retrying. |
| **CORS**                    | Cross-Origin Resource Sharing -- HTTP headers that control which origins can access the API from browsers.                                     |
| **Cursor-Based Pagination** | Pagination using opaque cursors (typically resource IDs) instead of page numbers, providing stable results for real-time data.                 |
| **Dead Letter Queue**       | Storage for webhook deliveries that have exhausted all retry attempts, kept for debugging and manual replay.                                   |
| **Domain Event**            | A typed message representing a state change in the system (e.g., `participant.approved`), published to the internal event bus.                 |
| **EventEmitter**            | Node.js built-in event system used as the current internal event bus transport. Future migration target: message queue.                        |
| **HATEOAS**                 | Hypermedia as the Engine of Application State -- including `_links` in API responses for discoverability.                                      |
| **HMAC-SHA256**             | Hash-based Message Authentication Code using SHA-256, used to sign webhook payloads for integrity verification.                                |
| **Idempotency Key**         | A unique identifier (event ID) ensuring that processing the same webhook delivery multiple times has the same effect as processing it once.    |
| **Offset-Based Pagination** | Traditional pagination using page number and page size, suitable for general-purpose listing.                                                  |
| **Optimistic Locking**      | Concurrency control where a version check occurs before writes; conflicts result in a 409 response rather than silent overwrites.              |
| **Rate Limiting**           | Controlling the number of API requests a consumer can make within a time window to protect against abuse and ensure fair usage.                |
| **SSE**                     | Server-Sent Events -- a unidirectional protocol for pushing real-time updates from server to client over HTTP.                                 |
| **Webhook**                 | An HTTP callback: when an event occurs, the platform sends an HTTP POST to a subscriber-registered URL.                                        |
| **Zod**                     | A TypeScript-first schema validation library used for request body and query parameter validation.                                             |

### B. References

| Reference                                                                      | Description                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| [RFC 7231](https://tools.ietf.org/html/rfc7231)                                | HTTP/1.1 Semantics and Content                               |
| [RFC 8594](https://tools.ietf.org/html/rfc8594)                                | The Sunset HTTP Header Field                                 |
| [RFC 6750](https://tools.ietf.org/html/rfc6750)                                | OAuth 2.0 Bearer Token Usage (reference for API key pattern) |
| [RFC 6585](https://tools.ietf.org/html/rfc6585)                                | Additional HTTP Status Codes (429 Too Many Requests)         |
| [W3C SSE Spec](https://html.spec.whatwg.org/multipage/server-sent-events.html) | Server-Sent Events specification                             |
| [Prisma Documentation](https://www.prisma.io/docs)                             | Prisma ORM reference                                         |
| [Zod Documentation](https://zod.dev)                                           | Zod schema validation library                                |
| [Remix Documentation](https://remix.run/docs)                                  | Remix framework reference                                    |
| Module 00: Architecture Overview                                               | Foundation architecture and multi-tenancy model              |
| Module 01: Data Model Foundation                                               | Core data models and database strategy                       |
| Module 04: Workflow Engine                                                     | Workflow step processing and SLA monitoring                  |
| Module 05: Security & Access Control                                           | Authentication, authorization, and audit framework           |
| Module 06: Infrastructure & DevOps                                             | Deployment, monitoring, and scaling infrastructure           |

### C. Complete Webhook Event Catalog

| Event Type                | Trigger                           | Payload Fields                                                                                         | Notes                               |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `participant.registered`  | New participant registration      | `participantId`, `eventId`, `firstName`, `lastName`, `email`, `organization`, `status`, `registeredAt` | Fired after validation passes       |
| `participant.approved`    | Participant approval in workflow  | `participantId`, `eventId`, `status`, `approvedBy`, `comment`, `approvedAt`                            | Includes optional reviewer comment  |
| `participant.rejected`    | Participant rejection in workflow | `participantId`, `eventId`, `status`, `rejectedBy`, `reason`, `rejectedAt`                             | Reason is required                  |
| `participant.printed`     | Badge printed for participant     | `participantId`, `eventId`, `badgeId`, `status`, `printedBy`, `printedAt`                              | Badge ID for tracking               |
| `participant.collected`   | Badge collected by participant    | `participantId`, `eventId`, `badgeId`, `status`, `collectedAt`                                         | Final status in accreditation flow  |
| `workflow.step.completed` | Workflow step processed           | `workflowInstanceId`, `participantId`, `eventId`, `step`, `action`, `performedBy`, `nextStep`          | Includes both current and next step |
| `workflow.sla.breached`   | SLA time exceeded for a step      | `workflowInstanceId`, `participantId`, `eventId`, `step`, `slaHours`, `actualHours`, `severity`        | Severity: WARNING or CRITICAL       |
| `test.ping`               | Manual test webhook trigger       | `message`: "Test webhook delivery"                                                                     | Used for endpoint verification      |

### D. Error Code Catalog

| HTTP Status | Error Code                  | Message                                     | Resolution                                                                  |
| ----------- | --------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| **400**     | `VALIDATION_ERROR`          | Request validation failed                   | Check `details` array for field-level errors. Fix and resubmit.             |
| **400**     | `INVALID_JSON`              | Request body is not valid JSON              | Ensure Content-Type is application/json and body is valid JSON.             |
| **400**     | `MISSING_REQUIRED_FIELD`    | A required field is missing                 | Add the missing field specified in the `details` array.                     |
| **400**     | `INVALID_STATUS_TRANSITION` | Cannot transition from current status       | Check the participant's current status. Only valid transitions are allowed. |
| **400**     | `BATCH_TOO_LARGE`           | Maximum batch size exceeded                 | Reduce the number of items in the bulk request to 100 or fewer.             |
| **401**     | `MISSING_API_KEY`           | X-API-Key header is required                | Include the X-API-Key header in your request.                               |
| **401**     | `INVALID_API_KEY`           | The provided API key is invalid             | Check the API key value. It may have been revoked or mistyped.              |
| **401**     | `EXPIRED_API_KEY`           | The API key has expired                     | Generate a new API key or contact your administrator.                       |
| **401**     | `REVOKED_API_KEY`           | The API key has been revoked                | This key was explicitly revoked. Generate a new one.                        |
| **403**     | `INSUFFICIENT_PERMISSIONS`  | API key lacks required permissions          | Request the needed permission from your administrator.                      |
| **403**     | `SCOPE_VIOLATION`           | Resource not within API key scope           | The API key is scoped to specific events. Access a scoped resource.         |
| **403**     | `TENANT_MISMATCH`           | Resource belongs to a different tenant      | You cannot access resources from another tenant.                            |
| **403**     | `IP_NOT_ALLOWED`            | Request IP not in API key allowlist         | Update the API key's IP allowlist or use an allowed IP.                     |
| **404**     | `NOT_FOUND`                 | Resource not found                          | The requested resource does not exist or is not accessible.                 |
| **409**     | `CONFLICT`                  | Resource was modified by another user       | Refetch the resource, resolve conflicts, and retry with new version.        |
| **409**     | `DUPLICATE_RESOURCE`        | A resource with the same key already exists | Use a different unique identifier (e.g., email for participants).           |
| **422**     | `REGISTRATION_CLOSED`       | Registration is closed for this event       | The event's registration deadline has passed.                               |
| **422**     | `EVENT_FULL`                | Event has reached maximum participants      | Contact the event administrator to increase capacity.                       |
| **428**     | `PRECONDITION_REQUIRED`     | If-Match header with version is required    | Include the If-Match header with the resource's current version.            |
| **429**     | `RATE_LIMIT_EXCEEDED`       | Rate limit exceeded                         | Wait for the time specified in the Retry-After header.                      |
| **500**     | `INTERNAL_ERROR`            | An unexpected error occurred                | Contact support with the requestId from the error response.                 |
| **503**     | `SERVICE_UNAVAILABLE`       | Service temporarily unavailable             | Retry after a brief delay. The service is under maintenance or overloaded.  |

---

_End of Module 07: API and Integration Layer_
