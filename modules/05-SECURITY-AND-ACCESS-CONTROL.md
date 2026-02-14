# Module 05: Security and Access Control

> **Requires:** [Module 00: Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md), [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md)
> **Required By:** All modules
> **Integrates With:** [Module 04: Workflow Engine](./04-WORKFLOW-ENGINE.md), [Module 07: API Layer](./07-API-AND-INTEGRATION-LAYER.md)

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
13. [Appendix](#appendix)

---

## 1. Overview

### 1.1 Purpose

This module defines the security architecture for the multi-tenant accreditation platform. It governs how users authenticate, how authorization decisions are made, how audit trails are maintained, and how the system defends against common web application threats. Because every other module depends on authentication and authorization primitives, this module is foundational -- no route loader executes, no action fires, and no API call succeeds without passing through the security middleware stack described here.

### 1.2 Scope

This module covers:

- **Authentication** -- session-based login, two-factor authentication (TOTP), progressive lockout, session fingerprinting, and session regeneration.
- **Authorization** -- role-based access control (RBAC) with three scope levels (GLOBAL, TENANT, EVENT), permission resolution, and event-level access grants.
- **Request Security** -- Content Security Policy, HSTS, rate limiting, CORS, CSRF protection, bot detection, and suspicious request blocking.
- **Data Protection** -- secrets management, backup encryption, tenant isolation, and admin impersonation.
- **Duplicate Detection & Blacklist** -- fuzzy matching on participant data, blacklist screening, and merge workflows.
- **Audit System** -- comprehensive event logging with retention and archival policies.
- **API Key Management** -- generation, scoping, rotation, and revocation of keys for external integrations.
- **GDPR Compliance** -- right to erasure, data portability, consent management, and breach notification.

### 1.3 Security Design Principles

**Defense in Depth.** No single layer is trusted to stop all threats. The platform applies security controls at every tier: network (HTTPS, HSTS), transport (CSP, CORS), application (authentication, authorization, input validation), and data (tenant isolation, encryption at rest). A failure in one layer is contained by the next.

**Least Privilege.** Every user, API key, and service account starts with zero permissions. Access is granted explicitly through role assignment and scoped to the narrowest context possible. A validator assigned to Step 3 of Event X cannot see Step 4 or Event Y. A tenant-scoped API key cannot read another tenant's participants.

**Zero Trust at Boundaries.** Every request is treated as potentially hostile. Session cookies are validated on every request. Tenant context is derived from the authenticated user, never from client-supplied headers. Even internal service calls between modules pass through the authorization middleware.

### 1.4 Threat Model Summary

| Threat Category               | Attack Vectors                                          | Primary Mitigations                                                      |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Credential Theft**          | Brute force, credential stuffing, phishing              | Progressive lockout, 2FA, session fingerprinting                         |
| **Session Hijacking**         | XSS, network sniffing, session fixation                 | HttpOnly/Secure cookies, CSP nonces, session regeneration                |
| **Privilege Escalation**      | IDOR, parameter tampering, role manipulation            | Tenant-scoped queries, server-side permission checks, input validation   |
| **Cross-Tenant Data Leakage** | Missing tenant filters, shared caches, URL manipulation | Mandatory `tenantId` FK on all records, middleware-injected tenant scope |
| **Injection Attacks**         | SQL injection, XSS, command injection                   | Prisma parameterized queries, DOMPurify, CSP                             |
| **API Abuse**                 | Scraping, denial of service, key theft                  | 3-tier rate limiting, API key scoping, request validation                |
| **Insider Threats**           | Admin abuse, unauthorized data export                   | Audit logging, impersonation tracking, least privilege                   |
| **Data Exposure**             | Unencrypted backups, leaked secrets, verbose errors     | AES-256 backup encryption, env-based secrets, production error masking   |

---

## 2. Architecture

### 2.1 Security Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  INBOUND REQUEST                                                      │
│  ├── HTTPS (TLS 1.2+)                                                │
│  └── Azure Load Balancer / Reverse Proxy                             │
├──────────────────────────────────────────────────────────────────────┤
│  EXPRESS MIDDLEWARE STACK (order matters)                              │
│                                                                       │
│  1. Helmet (CSP nonces, HSTS, X-Frame-Options, Permissions-Policy)   │
│  2. CORS (origin whitelist per environment)                           │
│  3. Suspicious Request Blocking (missing headers, bad patterns)       │
│  4. Rate Limiting Tier 1: General (100 req/min per IP)               │
│  5. Rate Limiting Tier 2: Mutations (50 req/min per IP)              │
│  6. Rate Limiting Tier 3: Auth endpoints (10 req/min per IP)         │
│  7. Cookie Parser + Session Hydration                                 │
│  8. CSRF Token Validation (non-GET requests)                          │
│  9. Request Body Validation (Content-Type, size limits)               │
│  10. Compression + Structured Logging (Pino)                          │
├──────────────────────────────────────────────────────────────────────┤
│  REACT ROUTER 7 LAYER                                                 │
│                                                                       │
│  ┌─── Route Loader / Action ───┐                                     │
│  │  requireUser(request)       │ ← Session validation                │
│  │  requireTenant(request)     │ ← Tenant context resolution         │
│  │  requirePermission(         │ ← Permission check                  │
│  │    user, entity, action)    │                                     │
│  │  requireEventAccess(        │ ← Event-level access check          │
│  │    user, eventId, stepId?)  │                                     │
│  └─────────────────────────────┘                                     │
├──────────────────────────────────────────────────────────────────────┤
│  BUSINESS LOGIC LAYER                                                 │
│  ├── All Prisma queries include WHERE tenantId = user.tenantId       │
│  ├── Audit events emitted for every state change                     │
│  └── Input sanitized (xss + DOMPurify) before storage                │
├──────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                           │
│  ├── PostgreSQL 16 (row-level tenant isolation via FK)               │
│  ├── Azure Blob Storage (tenant-prefixed containers)                 │
│  └── AES-256 encrypted backups                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────┐
│  Browser  │────▶│ POST /login  │────▶│  Validate    │────▶│  Check    │
│  (Form)   │     │  (username,  │     │  Credentials │     │  Lockout  │
│           │     │   password)  │     │  (bcrypt)    │     │  Status   │
└──────────┘     └──────────────┘     └──────────────┘     └─────┬─────┘
                                                                  │
                                          ┌───────────────────────┤
                                          ▼                       ▼
                                   ┌─────────────┐        ┌─────────────┐
                                   │   LOCKED     │        │  NOT LOCKED │
                                   │  Return 423  │        │             │
                                   │  + remaining │        └──────┬──────┘
                                   │    cooldown  │               │
                                   └─────────────┘               ▼
                                                          ┌─────────────┐
                                                          │  Password   │
                                                          │  Correct?   │
                                                          └──────┬──────┘
                                                    ┌────────────┤
                                                    ▼            ▼
                                             ┌───────────┐ ┌───────────┐
                                             │   NO      │ │   YES     │
                                             │ Increment │ │ Check 2FA │
                                             │ failures  │ │ enabled?  │
                                             │ Maybe lock│ └─────┬─────┘
                                             └───────────┘       │
                                                          ┌──────┤
                                                          ▼      ▼
                                                   ┌────────┐ ┌────────────┐
                                                   │ No 2FA │ │ 2FA Enabled│
                                                   │ Create │ │ Return     │
                                                   │ Session│ │ pending    │
                                                   │ Cookie │ │ session    │
                                                   └────────┘ └─────┬──────┘
                                                                    ▼
                                                            ┌──────────────┐
                                                            │ POST /2fa/   │
                                                            │   verify     │
                                                            │ (TOTP code)  │
                                                            └──────┬───────┘
                                                                   ▼
                                                            ┌──────────────┐
                                                            │ Regenerate   │
                                                            │ Session ID   │
                                                            │ Set Cookie   │
                                                            └──────────────┘
```

**Session lifecycle:**

1. On successful login (with or without 2FA), a `Session` record is created in the database.
2. The session ID is stored in an HttpOnly, Secure, SameSite=Lax cookie.
3. Session metadata stores the user agent and client hints (`sec-ch-ua`) for fingerprinting.
4. After 2FA verification, the session ID is regenerated to prevent fixation attacks.
5. Sessions expire after `auth.sessionExpirationDays` (default: 30 days).
6. Inactivity timeout triggers after `auth.inactivityTimeoutMinutes` (default: 60 minutes).

### 2.3 Authorization Flow

```
┌──────────────┐     ┌────────────────┐     ┌─────────────────┐
│  Incoming    │────▶│  Resolve User  │────▶│  Resolve Roles  │
│  Request     │     │  from Session  │     │  (user.roles[]) │
│              │     │                │     │                  │
└──────────────┘     └────────────────┘     └────────┬────────┘
                                                      │
                                                      ▼
                                              ┌──────────────┐
                                              │  Check Role  │
                                              │  Scope       │
                                              └──────┬───────┘
                               ┌─────────────────────┼────────────────────┐
                               ▼                     ▼                    ▼
                        ┌────────────┐       ┌─────────────┐     ┌────────────┐
                        │   GLOBAL   │       │   TENANT    │     │   EVENT    │
                        │  (Platform │       │  (Tenant    │     │  (Check    │
                        │   Admin)   │       │   Admin)    │     │  UserEvent │
                        │  All access│       │  Own tenant │     │  Access)   │
                        └────────────┘       └──────┬──────┘     └─────┬──────┘
                                                    │                  │
                                                    ▼                  ▼
                                             ┌────────────┐    ┌──────────────┐
                                             │  Verify    │    │  Verify      │
                                             │  tenantId  │    │  eventId +   │
                                             │  matches   │    │  stepId      │
                                             │  user's    │    │  in access   │
                                             │  tenant    │    │  grant       │
                                             └────────────┘    └──────────────┘
                                                    │                  │
                                                    ▼                  ▼
                                             ┌────────────────────────────┐
                                             │  Check Permission          │
                                             │  (action + entity + access)│
                                             │  against role.permissions  │
                                             └────────────────────────────┘
```

**Authorization hierarchy:**

```
Platform Admin (GLOBAL scope) --> all tenants, all events, all actions
Tenant Admin   (TENANT scope) --> own tenant's data, all events within tenant
Event Roles    (EVENT scope)  --> per-event via UserEventAccess
  |-- validator  --> review/approve at assigned steps
  |-- printer    --> print queue operations
  |-- dispatcher --> badge collection operations
  |-- focal      --> delegation management
  +-- reviewer   --> read-only oversight
```

### 2.4 Security Middleware Stack

```typescript
// server.ts -- Express middleware registration order
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

export function configureSecurityMiddleware(app: Express) {
  // 1. Helmet: CSP, HSTS, X-Frame-Options, etc.
  app.use((req, res, next) => {
    const nonce = crypto.randomBytes(16).toString("base64");
    res.locals.cspNonce = nonce;
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", `'nonce-${nonce}'`],
          styleSrc: ["'self'", `'nonce-${nonce}'`],
          imgSrc: ["'self'", "data:", "blob:", process.env.AZURE_STORAGE_URL],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      permissionsPolicy: {
        features: {
          camera: ["'self'"], // QR scanning
          microphone: ["'none'"],
          geolocation: ["'none'"],
          payment: ["'none'"],
        },
      },
    })(req, res, next);
  });

  // 2. CORS
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-API-Key"],
    }),
  );

  // 3. Suspicious request blocking
  app.use(blockSuspiciousRequests);

  // 4. Rate limiting -- general
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip || "unknown",
      message: { error: "Too many requests, please try again later." },
    }),
  );

  // 5. Rate limiting -- mutations
  app.use(
    "/api",
    rateLimit({
      windowMs: 60 * 1000,
      max: 50,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.method === "GET",
    }),
  );

  // 6. Rate limiting -- auth endpoints
  app.use(
    "/auth",
    rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
}
```

```typescript
// Suspicious request blocking middleware
function blockSuspiciousRequests(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.headers["user-agent"];
  const accept = req.headers["accept"];

  // Block requests with missing essential headers
  if (!userAgent || !accept) {
    return res.status(400).json({ error: "Bad request" });
  }

  // Block common scanner patterns
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /openvas/i,
    /\.\.\//, // path traversal
    /<script/i, // reflected XSS attempts in URL
    /union\s+select/i, // SQL injection in URL
  ];

  const fullUrl = req.originalUrl;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl)) {
      await createAuditLog({
        action: "SUSPICIOUS_REQUEST",
        entityType: "SYSTEM",
        description: `Blocked suspicious request: ${pattern.source}`,
        metadata: { url: fullUrl, ip: req.ip, userAgent },
        ipAddress: req.ip,
        userAgent: userAgent,
      });
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  next();
}
```

---

## 3. Data Model

### 3.1 Security-Related Models

These models are defined in Module 01: Data Model Foundation and referenced here for context.

```prisma
model User {
  id                  String     @id @default(cuid())
  email               String     @unique
  username            String     @unique
  name                String?
  status              UserStatus @default(ACTIVE)
  failedLoginAttempts Int        @default(0)
  lastFailedLoginAt   DateTime?
  lockedAt            DateTime?
  lockReason          String?
  lockCount           Int        @default(0)
  autoUnlockAt        DateTime?
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt
  deletedAt           DateTime?

  image                  UserImage?
  password               Password?
  tenantId               String?
  tenant                 Tenant?    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  roles                  Role[]
  sessions               Session[]
  approvals              Approval[]
  participants           Participant[]
  auditLogs              AuditLog[]
  eventAccess            UserEventAccess[]

  @@index([deletedAt])
}

model Role {
  id          String    @id @default(cuid())
  name        String
  scope       RoleScope @default(EVENT)
  description String?
  tenantId    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  permissions   Permission[]
  users         User[]
  steps         Step[]
  eventAccess   UserEventAccess[]

  @@unique([tenantId, name])
  @@index([scope])
}

enum RoleScope {
  GLOBAL
  TENANT
  EVENT
}

model Permission {
  id          String   @id @default(cuid())
  action      String   // create, read, update, delete, approve, print, collect, export
  entity      String   // participant, event, workflow, template, report, etc.
  access      String   // own, tenant, global
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  roles       Role[]

  @@unique([action, entity, access])
}

model Session {
  id             String   @id @default(cuid())
  expirationDate DateTime
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  metadata       Json?    // { userAgent, secChUa, ipAddress, is2FAVerified }
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([userId])
}

model UserEventAccess {
  id       String  @id @default(cuid())
  userId   String
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId  String
  event    Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  roleId   String
  role     Role    @relation(fields: [roleId], references: [id], onDelete: Cascade)
  stepId   String? // Optional: restrict to a specific step
  step     Step?   @relation(fields: [stepId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId, roleId])
  @@index([userId, eventId])
  @@index([eventId, roleId])
}
```

### 3.2 Audit Models

```prisma
model AuditLog {
  id          String          @id @default(cuid())
  tenantId    String?
  tenant      Tenant?         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId      String?
  user        User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  action      AuditAction
  entityType  AuditEntityType
  entityId    String?
  description String
  metadata    Json?           // Flexible payload: { oldValue, newValue, batchSize, ... }
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime        @default(now())

  @@index([tenantId, action])
  @@index([tenantId, entityType, entityId])
  @@index([tenantId, userId])
  @@index([createdAt])
}

enum AuditAction {
  // Authentication
  LOGIN
  LOGIN_FAILED
  LOGOUT
  TWO_FACTOR_SETUP
  TWO_FACTOR_VERIFIED
  TWO_FACTOR_FAILED
  PASSWORD_CHANGED
  PASSWORD_RESET_REQUESTED
  PASSWORD_RESET_COMPLETED
  ACCOUNT_LOCKED
  ACCOUNT_UNLOCKED

  // User management
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  USER_ROLE_ASSIGNED
  USER_ROLE_REMOVED
  USER_EVENT_ACCESS_GRANTED
  USER_EVENT_ACCESS_REVOKED
  USER_IMPERSONATED

  // Participant lifecycle
  PARTICIPANT_CREATED
  PARTICIPANT_UPDATED
  PARTICIPANT_DELETED
  PARTICIPANT_IMPORTED

  // Workflow actions
  STEP_APPROVED
  STEP_REJECTED
  STEP_BYPASSED
  BATCH_APPROVED
  BATCH_REJECTED
  SLA_BREACHED

  // Badge operations
  BADGE_PRINTED
  BADGE_REPRINTED
  BADGE_COLLECTED

  // Event management
  EVENT_CREATED
  EVENT_UPDATED
  EVENT_PUBLISHED
  EVENT_CANCELED
  WORKFLOW_CREATED
  WORKFLOW_UPDATED
  TEMPLATE_CREATED
  TEMPLATE_UPDATED

  // Security events
  SUSPICIOUS_REQUEST
  RATE_LIMIT_EXCEEDED
  BLACKLIST_HIT
  BLACKLIST_OVERRIDE
  BLACKLIST_ENTRY_ADDED
  BLACKLIST_ENTRY_REMOVED
  DUPLICATE_DETECTED
  DUPLICATE_MERGED
  API_KEY_CREATED
  API_KEY_REVOKED
  API_KEY_ROTATED

  // Data operations
  BULK_EXPORT
  DATA_ERASURE_REQUESTED
  DATA_ERASURE_COMPLETED
  BACKUP_CREATED
  SETTINGS_UPDATED
}

enum AuditEntityType {
  USER
  SESSION
  PARTICIPANT
  EVENT
  WORKFLOW
  STEP
  TEMPLATE
  INVITATION
  DELEGATION
  BADGE
  BLACKLIST
  API_KEY
  SYSTEM
  REPORT
  SETTING
}
```

### 3.3 Blacklist Models

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
  fieldResolution   Json     // { name: "survivingId", email: "mergedId", ... }
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

### 3.4 API Key Models

```prisma
model ApiKey {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String    // Human-readable label: "CI/CD Pipeline", "Mobile App"
  keyHash     String    @unique  // SHA-256 hash of the actual key (never store plaintext)
  keyPrefix   String    // First 8 chars for identification: "ak_3f8b..."
  permissions Json      // ["participants:read", "events:read", "participants:approve"]
  eventIds    String[]  // Empty = all events; populated = scoped to specific events
  rateLimit   Int       @default(1000) // Requests per hour
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  isActive    Boolean   @default(true)
  createdBy   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([tenantId, isActive])
  @@index([keyHash])
}
```

---

## 4. API Specification

### 4.1 Authentication Endpoints

| Method | Path                           | Description                              | Rate Limit |
| ------ | ------------------------------ | ---------------------------------------- | ---------- |
| `POST` | `/auth/login`                  | Authenticate with username + password    | 10/min     |
| `POST` | `/auth/logout`                 | Destroy session                          | 100/min    |
| `POST` | `/auth/2fa/setup`              | Generate TOTP secret and QR code         | 10/min     |
| `POST` | `/auth/2fa/verify`             | Verify TOTP code, complete login         | 10/min     |
| `POST` | `/auth/2fa/disable`            | Disable 2FA (requires current TOTP code) | 10/min     |
| `POST` | `/auth/password/reset-request` | Send password reset email                | 10/min     |
| `POST` | `/auth/password/reset`         | Set new password using reset token       | 10/min     |
| `POST` | `/auth/password/change`        | Change password (authenticated)          | 10/min     |

**POST /auth/login**

```typescript
// Request
{ username: string; password: string }

// Response 200 -- success (no 2FA)
{ user: { id, name, email, tenantId, roles: [] }, redirectTo: "/dashboard" }

// Response 200 -- 2FA required
{ requires2FA: true, sessionId: string }

// Response 401 -- bad credentials
{ error: "Invalid username or password", remainingAttempts: 3 }

// Response 423 -- account locked
{ error: "Account locked", unlockAt: "2026-02-10T15:30:00Z", reason: "Too many failed attempts" }
```

### 4.2 Authorization Endpoints

| Method   | Path                                      | Description                  | Required Permission |
| -------- | ----------------------------------------- | ---------------------------- | ------------------- |
| `GET`    | `/admin/roles`                            | List all roles               | `roles:read`        |
| `POST`   | `/admin/roles`                            | Create a role                | `roles:create`      |
| `PUT`    | `/admin/roles/:id`                        | Update a role                | `roles:update`      |
| `DELETE` | `/admin/roles/:id`                        | Delete a role                | `roles:delete`      |
| `GET`    | `/admin/permissions`                      | List all permissions         | `permissions:read`  |
| `POST`   | `/admin/roles/:id/permissions`            | Assign permissions to a role | `roles:update`      |
| `POST`   | `/admin/users/:id/roles`                  | Assign a role to a user      | `users:update`      |
| `DELETE` | `/admin/users/:id/roles/:roleId`          | Remove a role from a user    | `users:update`      |
| `POST`   | `/admin/users/:id/event-access`           | Grant event-level access     | `users:update`      |
| `DELETE` | `/admin/users/:id/event-access/:accessId` | Revoke event-level access    | `users:update`      |

### 4.3 Audit Endpoints

| Method | Path                                      | Description                              | Required Permission |
| ------ | ----------------------------------------- | ---------------------------------------- | ------------------- |
| `GET`  | `/admin/audit-logs`                       | Query audit logs (paginated, filterable) | `audit:read`        |
| `GET`  | `/admin/audit-logs/export`                | Export audit logs as CSV                 | `audit:export`      |
| `GET`  | `/admin/audit-logs/:entityType/:entityId` | Get audit trail for a specific entity    | `audit:read`        |

**GET /admin/audit-logs query parameters:**

```
?action=LOGIN_FAILED        // Filter by action
&entityType=USER             // Filter by entity type
&userId=cuid_xxx             // Filter by acting user
&from=2026-01-01T00:00:00Z  // Start date
&to=2026-02-01T00:00:00Z    // End date
&page=1&pageSize=50          // Pagination
&sort=createdAt:desc         // Sorting
```

### 4.4 Session Management Endpoints

| Method   | Path                                   | Description                       | Required Permission |
| -------- | -------------------------------------- | --------------------------------- | ------------------- |
| `GET`    | `/admin/users/:id/sessions`            | List active sessions for a user   | `sessions:read`     |
| `DELETE` | `/admin/users/:id/sessions/:sessionId` | Terminate a specific session      | `sessions:delete`   |
| `DELETE` | `/admin/users/:id/sessions`            | Terminate all sessions for a user | `sessions:delete`   |
| `GET`    | `/auth/me`                             | Get current user + session info   | Authenticated       |

---

## 5. Business Logic

### 5.1 Authentication System

#### 5.1.1 Session Management

Sessions are stored in the database rather than in-memory to support horizontal scaling. Each session record captures creation time, expiration, and metadata used for fingerprinting.

```typescript
// app/utils/auth.server.ts

import { prisma } from "~/utils/db.server";
import crypto from "node:crypto";

interface SessionMetadata {
  userAgent: string;
  secChUa: string | null;
  ipAddress: string;
  is2FAVerified: boolean;
}

export async function createSession(
  userId: string,
  metadata: SessionMetadata,
  expirationDays: number = 30,
): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId,
      expirationDate: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000),
      metadata: metadata as any,
    },
  });
  return session.id;
}

export async function validateSession(sessionId: string): Promise<{
  user: User;
  session: Session;
} | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          roles: { include: { permissions: true } },
          tenant: true,
          eventAccess: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expirationDate < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } });
    return null;
  }

  return { user: session.user, session };
}

export async function regenerateSession(
  oldSessionId: string,
  updates: Partial<SessionMetadata>,
): Promise<string> {
  const oldSession = await prisma.session.findUnique({
    where: { id: oldSessionId },
  });
  if (!oldSession) throw new Error("Session not found");

  const metadata = { ...(oldSession.metadata as any), ...updates };

  const [_, newSession] = await prisma.$transaction([
    prisma.session.delete({ where: { id: oldSessionId } }),
    prisma.session.create({
      data: {
        userId: oldSession.userId,
        expirationDate: oldSession.expirationDate,
        metadata,
      },
    }),
  ]);

  return newSession.id;
}
```

#### 5.1.2 Password Hashing

Passwords are hashed using bcrypt with a configurable cost factor (default: 10 rounds). The platform enforces password complexity rules at both the client and server.

```typescript
// app/utils/password.server.ts

import bcrypt from "bcryptjs";
import { getSettingValue } from "~/utils/settings.server";

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export async function getPasswordPolicy(): Promise<PasswordPolicy> {
  return {
    minLength: await getSettingValue("auth.passwordMinLength", 8),
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: await getSettingValue("auth.passwordRequireSpecial", true),
  };
}

export function validatePasswordComplexity(password: string, policy: PasswordPolicy): string[] {
  const errors: string[] = [];
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  return errors;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = await getSettingValue("auth.bcryptSaltRounds", 10);
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

#### 5.1.3 Two-Factor Authentication

TOTP-based 2FA using the `otpauth` library. When enabled, the user must provide a 6-digit code from their authenticator app after password verification. Backup codes are generated during setup for account recovery.

```typescript
// app/utils/totp.server.ts

import { TOTP } from "otpauth";
import crypto from "node:crypto";

const BACKUP_CODE_COUNT = 10;

export function generateTOTPSecret(username: string): {
  secret: string;
  uri: string;
} {
  const totp = new TOTP({
    issuer: "Accreditation Platform",
    label: username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

export function verifyTOTPCode(secret: string, code: string): boolean {
  const totp = new TOTP({
    secret,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  // Allow 1-step window for clock drift
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export function generateBackupCodes(): string[] {
  return Array.from(
    { length: BACKUP_CODE_COUNT },
    () => crypto.randomBytes(4).toString("hex"), // 8-char hex codes
  );
}
```

#### 5.1.4 Progressive Lockout

The platform uses escalating lockout durations to deter brute-force attacks. Each lockout doubles the duration, and after a configurable number of lockouts, the account requires manual admin intervention.

```
Failed Attempt Tracking:
  Attempt 1-4  --> increment failedLoginAttempts counter
  Attempt 5    --> LOCK (lockCount = 1, duration = 30 min)
  Auto-unlock after 30 min, reset failedLoginAttempts to 0

  Next 5 fails --> LOCK (lockCount = 2, duration = 60 min)
  Next 5 fails --> LOCK (lockCount = 3, duration = PERMANENT, admin unlock required)

Configuration (via SystemSetting):
  auth.maxLoginAttempts       = 5    (failures before lockout)
  auth.lockoutDurationMinutes = 30   (base lockout duration)
  auth.autoResetAfterMinutes  = 60   (reset failure counter after inactivity)
  auth.maxLockCount           = 3    (lockouts before permanent lock)
```

```typescript
// app/utils/lockout.server.ts

import { prisma } from "~/utils/db.server";
import { getSettingValue } from "~/utils/settings.server";

export async function checkAndHandleFailedLogin(userId: string): Promise<{
  isLocked: boolean;
  unlockAt: Date | null;
  remainingAttempts: number;
}> {
  const maxAttempts = await getSettingValue("auth.maxLoginAttempts", 5);
  const baseLockoutMinutes = await getSettingValue("auth.lockoutDurationMinutes", 30);
  const maxLockCount = await getSettingValue("auth.maxLockCount", 3);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const newFailedAttempts = user.failedLoginAttempts + 1;

  if (newFailedAttempts >= maxAttempts) {
    const newLockCount = user.lockCount + 1;
    const isPermanentLock = newLockCount >= maxLockCount;
    const lockoutMinutes = isPermanentLock
      ? null
      : baseLockoutMinutes * Math.pow(2, newLockCount - 1);

    const autoUnlockAt = isPermanentLock
      ? null
      : new Date(Date.now() + lockoutMinutes! * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockCount: newLockCount,
        lockedAt: new Date(),
        autoUnlockAt,
        lockReason: isPermanentLock
          ? "Maximum lockout count exceeded -- admin unlock required"
          : `Locked after ${maxAttempts} failed attempts`,
      },
    });

    return { isLocked: true, unlockAt: autoUnlockAt, remainingAttempts: 0 };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newFailedAttempts,
      lastFailedLoginAt: new Date(),
    },
  });

  return {
    isLocked: false,
    unlockAt: null,
    remainingAttempts: maxAttempts - newFailedAttempts,
  };
}

export async function isAccountLocked(userId: string): Promise<{
  locked: boolean;
  unlockAt: Date | null;
}> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.lockedAt) return { locked: false, unlockAt: null };

  // Check if auto-unlock time has passed
  if (user.autoUnlockAt && user.autoUnlockAt < new Date()) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedAt: null,
        autoUnlockAt: null,
        failedLoginAttempts: 0,
        lockReason: null,
      },
    });
    return { locked: false, unlockAt: null };
  }

  return { locked: true, unlockAt: user.autoUnlockAt };
}
```

#### 5.1.5 Suspicious Request Blocking

Requests missing a `User-Agent` or `Accept` header are rejected outright. URL patterns matching known scanner signatures (sqlmap, Nikto, path traversal) are blocked and logged. Honeypot fields on public forms detect automated submissions.

```typescript
// Honeypot field integration in registration forms
// A hidden field that legitimate users never fill in
export function HoneypotField() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
      <label htmlFor="website_url">Website</label>
      <input type="text" id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

// Server-side check in action handler
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  if (formData.get('website_url')) {
    // Bot detected -- silently accept but do not process
    return json({ success: true }); // Fake success to confuse bots
  }
  // ... proceed with real registration
}
```

### 5.2 Authorization System

#### 5.2.1 RBAC Model

Roles operate at three scope levels:

| Scope      | Assignment          | Data Access                                | Example Roles                                   |
| ---------- | ------------------- | ------------------------------------------ | ----------------------------------------------- |
| **GLOBAL** | Direct on User      | All tenants, all events                    | Platform Admin, Super Admin                     |
| **TENANT** | Direct on User      | Own tenant, all events within tenant       | Tenant Admin, Tenant Viewer                     |
| **EVENT**  | Via UserEventAccess | Specific events, optionally specific steps | validator, printer, dispatcher, focal, reviewer |

**Key rules:**

- A user can hold multiple roles simultaneously (a user can be both a validator for Event A and a printer for Event B).
- GLOBAL scope encompasses TENANT scope which encompasses EVENT scope.
- Roles are tenant-scoped (the "validator" role in Tenant A is separate from the "validator" role in Tenant B), except GLOBAL roles which have `tenantId = null`.

#### 5.2.2 Permission Resolution Algorithm

```typescript
// app/utils/permissions.server.ts

import { redirect } from "react-router";

type PermissionCheck = {
  entity: string;
  action: string;
  access?: string; // 'own' | 'tenant' | 'global'
};

export async function requireUser(request: Request) {
  const sessionId = await getSessionId(request);
  if (!sessionId) throw redirect("/login");

  const result = await validateSession(sessionId);
  if (!result) throw redirect("/login");

  return result.user;
}

export async function requireUserWithPermission(request: Request, permission: PermissionCheck) {
  const user = await requireUser(request);
  const hasPermission = userHasPermission(user, permission);

  if (!hasPermission) {
    throw new Response("Forbidden", { status: 403 });
  }

  return user;
}

export function userHasPermission(user: UserWithRoles, check: PermissionCheck): boolean {
  for (const role of user.roles) {
    // GLOBAL scope: automatic access to everything
    if (role.scope === "GLOBAL") return true;

    for (const permission of role.permissions) {
      if (permission.entity !== check.entity) continue;
      if (permission.action !== check.action) continue;

      // Access level hierarchy: global > tenant > own
      if (check.access === "own") return true; // Any access level satisfies 'own'
      if (check.access === "tenant" && ["tenant", "global"].includes(permission.access))
        return true;
      if (check.access === "global" && permission.access === "global") return true;
      if (!check.access) return true; // No specific access level required
    }
  }

  return false;
}

export async function requireEventAccess(
  request: Request,
  eventId: string,
  requiredRole?: string,
  stepId?: string,
) {
  const user = await requireUser(request);

  // GLOBAL and TENANT scope roles have implicit event access
  const hasGlobalOrTenantRole = user.roles.some(
    (r) => r.scope === "GLOBAL" || r.scope === "TENANT",
  );
  if (hasGlobalOrTenantRole) return user;

  // Check UserEventAccess for EVENT scope roles
  const access = user.eventAccess.find((ea) => {
    if (ea.eventId !== eventId) return false;
    if (requiredRole && ea.role.name !== requiredRole) return false;
    if (stepId && ea.stepId && ea.stepId !== stepId) return false;
    return true;
  });

  if (!access) {
    throw new Response("Forbidden: No access to this event", { status: 403 });
  }

  return user;
}
```

#### 5.2.3 Complete Permission Matrix

Each cell indicates which role scopes can perform the action. **G** = GLOBAL, **T** = TENANT, **E** = EVENT (with appropriate UserEventAccess).

| Entity            | create         | read              | update             | delete       | approve      | reject       | print      | collect       | export | import |
| ----------------- | -------------- | ----------------- | ------------------ | ------------ | ------------ | ------------ | ---------- | ------------- | ------ | ------ |
| **Tenant**        | G              | G, T(own)         | G, T(own)          | G            | --           | --           | --         | --            | G      | G      |
| **User**          | G, T           | G, T              | G, T               | G, T         | --           | --           | --         | --            | G, T   | G, T   |
| **Role**          | G, T           | G, T              | G, T               | G, T         | --           | --           | --         | --            | --     | --     |
| **Permission**    | G              | G, T              | G                  | G            | --           | --           | --         | --            | --     | --     |
| **Event**         | G, T           | G, T, E           | G, T               | G, T         | --           | --           | --         | --            | G, T   | --     |
| **Workflow**      | G, T           | G, T, E           | G, T               | G, T         | --           | --           | --         | --            | --     | --     |
| **Step**          | G, T           | G, T, E           | G, T               | G, T         | --           | --           | --         | --            | --     | --     |
| **Participant**   | G, T, E(focal) | G, T, E           | G, T, E(validator) | G, T         | E(validator) | E(validator) | E(printer) | E(dispatcher) | G, T   | G, T   |
| **Template**      | G, T           | G, T, E           | G, T               | G, T         | --           | --           | --         | --            | --     | --     |
| **BadgeTemplate** | G, T           | G, T, E           | G, T               | G, T         | --           | --           | --         | --            | --     | --     |
| **FormTemplate**  | G, T           | G, T, E           | G, T               | G, T         | --           | --           | --         | --            | --     | --     |
| **Invitation**    | G, T           | G, T, E(focal)    | G, T               | G, T         | --           | --           | --         | --            | G, T   | G, T   |
| **Report**        | G, T           | G, T, E(reviewer) | G, T               | G, T         | --           | --           | --         | --            | G, T   | --     |
| **AuditLog**      | --             | G, T              | --                 | --           | --           | --           | --         | --            | G, T   | --     |
| **Blacklist**     | G, T           | G, T              | G, T               | G, T         | --           | --           | --         | --            | G, T   | G, T   |
| **ApiKey**        | G, T           | G, T              | G, T               | G, T         | --           | --           | --         | --            | --     | --     |
| **SystemSetting** | G              | G, T(own)         | G, T(own)          | G            | --           | --           | --         | --            | --     | --     |
| **CustomField**   | G, T           | G, T, E           | G, T               | G, T         | --           | --           | --         | --            | --     | --     |
| **SavedView**     | G, T, E        | G, T, E           | G, T, E(own)       | G, T, E(own) | --           | --           | --         | --            | --     | --     |

#### 5.2.4 Event-Level Access Control

Event-level access is managed through the `UserEventAccess` model. A tenant admin grants a user a specific role within a specific event, optionally constrained to a specific workflow step.

```typescript
// Grant a user validator access to Step 3 of Event X
await prisma.userEventAccess.create({
  data: {
    userId: "user_abc",
    eventId: "event_xyz",
    roleId: validatorRoleId,
    stepId: "step_3", // Optional: null = all steps
  },
});

// Query: get all steps a validator can access for an event
export async function getUserAccessibleStepIds(
  userId: string,
  eventId?: string,
): Promise<string[]> {
  const accessGrants = await prisma.userEventAccess.findMany({
    where: {
      userId,
      ...(eventId ? { eventId } : {}),
    },
    include: { role: true },
  });

  // If any grant has stepId = null, user has access to all steps
  const hasUnrestrictedAccess = accessGrants.some((g) => g.stepId === null);
  if (hasUnrestrictedAccess) {
    const allSteps = await prisma.step.findMany({
      where: { workflow: { eventId: eventId! } },
      select: { id: true },
    });
    return allSteps.map((s) => s.id);
  }

  return accessGrants.filter((g) => g.stepId !== null).map((g) => g.stepId!);
}
```

### 5.3 Rate Limiting

Three-tier rate limiting applied via Express middleware:

| Tier          | Target                    | Limit                               | Window   | Key        |
| ------------- | ------------------------- | ----------------------------------- | -------- | ---------- |
| **General**   | All routes                | 100 requests                        | 1 minute | IP address |
| **Mutations** | POST/PUT/DELETE on `/api` | 50 requests                         | 1 minute | IP address |
| **Auth**      | `/auth/*` endpoints       | 10 requests                         | 1 minute | IP address |
| **API Key**   | `/api/v1/*` (external)    | Configurable per key (default 1000) | 1 hour   | API key    |

When a rate limit is exceeded, the server responds with HTTP 429 and includes `Retry-After` and `X-RateLimit-Reset` headers. Rate limit violations are logged as `RATE_LIMIT_EXCEEDED` audit events.

### 5.4 Content Security Policy

The platform uses nonce-based CSP to prevent inline script injection. Every response includes a fresh cryptographic nonce that is embedded in both the CSP header and allowed `<script>` / `<style>` tags.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'nonce-{random}';
  img-src 'self' data: blob: https://<storage>.blob.core.windows.net;
  connect-src 'self';
  font-src 'self';
  object-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';

Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=()
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

### 5.5 Duplicate Detection & Blacklist

In large diplomatic events, duplicate registrations are common: a participant is registered by their embassy focal point, then also registers themselves; a person uses a slightly different name spelling across two events; or a known security risk attempts registration under an alias. Without systematic detection, duplicates waste quota, create confusion at badge collection (two badges for one person), and potentially breach security. The duplicate detection engine uses multi-field scoring to identify candidates, while the blacklist system screens every registration against security watchlists.

#### 5.5.1 Matching Algorithm

```
On participant registration submission:

  --> Step 1: Exact match checks (confidence = 1.0)
    - Passport number exact match --> 1.0
    - Email exact match --> 0.95

  --> Step 2: Fuzzy match checks
    - Name similarity (Levenshtein distance <= 2):
      "Mohammed Hassan" vs "Muhammad Hassan" --> 0.85
      Transliteration handling: Arabic --> Latin variations stored in lookup table
    - Name + Date of Birth match --> 0.90
    - Name + Country match --> 0.70
    - Phone number match (normalized, strip country code) --> 0.80

  --> Step 3: Cross-field scoring
    confidenceScore = max(individual field scores)
    If multiple fields match: boost score by 0.05 per additional match
    Example: name (0.85) + country (0.70) --> combined score: 0.90

  --> Step 4: Threshold decision
    - Score >= 0.90 --> Auto-flag: registration held, DuplicateCandidate created (PENDING_REVIEW)
    - Score 0.70 - 0.89 --> Warning flag: registration proceeds but admin notified
    - Score < 0.70 --> No action

  --> Cross-event detection:
    - After within-event check, run same algorithm against participants
      from all concurrent events for the same tenant
    - "Same passport number registered for Summit AND Youth Forum"
```

```typescript
// app/utils/duplicate-detection.server.ts

import levenshtein from "fast-levenshtein";

interface MatchResult {
  participantId: string;
  confidenceScore: number;
  matchFields: Record<string, number>;
}

export async function detectDuplicates(
  tenantId: string,
  eventId: string,
  candidate: {
    firstName: string;
    lastName: string;
    passportNumber?: string;
    email?: string;
    dateOfBirth?: Date;
    nationality?: string;
    phone?: string;
  },
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];

  // Step 1: Exact matches on passport
  if (candidate.passportNumber) {
    const passportMatches = await prisma.participant.findMany({
      where: {
        tenantId,
        passportNumber: candidate.passportNumber,
        deletedAt: null,
      },
      select: { id: true, firstName: true, lastName: true },
    });
    for (const match of passportMatches) {
      results.push({
        participantId: match.id,
        confidenceScore: 1.0,
        matchFields: { passport: 1.0 },
      });
    }
  }

  // Step 2: Fuzzy name matching
  const nameQuery = `${candidate.firstName} ${candidate.lastName}`;
  const potentialMatches = await prisma.participant.findMany({
    where: { tenantId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      dateOfBirth: true,
      nationality: true,
      phone: true,
    },
  });

  for (const existing of potentialMatches) {
    if (results.find((r) => r.participantId === existing.id)) continue;

    const existingName = `${existing.firstName} ${existing.lastName}`;
    const distance = levenshtein.get(nameQuery.toLowerCase(), existingName.toLowerCase());

    const matchFields: Record<string, number> = {};
    if (distance <= 2) matchFields.name = Math.max(0, 1.0 - distance * 0.075);

    if (candidate.email && existing.email === candidate.email) {
      matchFields.email = 0.95;
    }
    if (
      candidate.dateOfBirth &&
      existing.dateOfBirth &&
      candidate.dateOfBirth.getTime() === existing.dateOfBirth.getTime()
    ) {
      matchFields.dateOfBirth = 0.85;
    }
    if (candidate.nationality && existing.nationality === candidate.nationality) {
      matchFields.nationality = 0.5;
    }

    if (Object.keys(matchFields).length === 0) continue;

    // Cross-field scoring
    let score = Math.max(...Object.values(matchFields));
    const additionalMatches = Object.keys(matchFields).length - 1;
    score = Math.min(1.0, score + additionalMatches * 0.05);

    if (score >= 0.7) {
      results.push({
        participantId: existing.id,
        confidenceScore: score,
        matchFields,
      });
    }
  }

  return results.sort((a, b) => b.confidenceScore - a.confidenceScore);
}
```

#### 5.5.2 Blacklist Management

```
On every participant registration:
  --> Extract: name, passport number, email, organization, nationality
  --> Query Blacklist table:
    1. Exact passport number match
    2. Exact email match
    3. Fuzzy name match against name + nameVariations
    4. Organization match
  --> If any match found:
    - Registration is NOT entered into workflow
    - Status set to FLAGGED
    - Admin receives alert: "Registration matches blacklist entry #42"
    - Admin reviews:
      [Confirm Block] --> registration rejected, participant notified
      [Override -- Allow] --> registration enters workflow, override logged with reason
```

```typescript
// app/utils/blacklist.server.ts

export async function screenAgainstBlacklist(
  tenantId: string,
  candidate: {
    name: string;
    passportNumber?: string;
    email?: string;
    organization?: string;
    nationality?: string;
  },
): Promise<{ matched: boolean; entries: BlacklistMatch[] }> {
  const entries: BlacklistMatch[] = [];

  const blacklistRecords = await prisma.blacklist.findMany({
    where: {
      isActive: true,
      OR: [{ tenantId }, { tenantId: null }], // Check both tenant and global lists
      expiresAt: { gt: new Date() }, // Not expired (or null = no expiry)
    },
  });

  for (const record of blacklistRecords) {
    let matchReason: string | null = null;

    // Exact passport match
    if (candidate.passportNumber && record.passportNumber === candidate.passportNumber) {
      matchReason = "Passport number exact match";
    }

    // Exact email match
    if (!matchReason && candidate.email && record.email === candidate.email) {
      matchReason = "Email exact match";
    }

    // Fuzzy name match against name + nameVariations
    if (!matchReason && record.name) {
      const allNames = [record.name, ...(record.nameVariations || [])];
      for (const variant of allNames) {
        const distance = levenshtein.get(candidate.name.toLowerCase(), variant.toLowerCase());
        if (distance <= 2) {
          matchReason = `Name fuzzy match: "${variant}" (distance: ${distance})`;
          break;
        }
      }
    }

    // Organization match
    if (!matchReason && candidate.organization && record.organization === candidate.organization) {
      matchReason = "Organization exact match";
    }

    if (matchReason) {
      entries.push({
        blacklistId: record.id,
        reason: record.reason,
        source: record.source,
        matchReason,
      });
    }
  }

  return { matched: entries.length > 0, entries };
}
```

**Blacklist import/export:**

Administrators can import blacklist entries via CSV upload and export the current list for external distribution. The CSV format includes: `type, name, nameVariations (semicolon-separated), passportNumber, email, dateOfBirth, nationality, organization, reason, source, expiresAt`.

#### 5.5.3 Duplicate Resolution Workflow

```
Admin clicks [Merge A <-- B] (A survives, B is absorbed):
  --> Field resolution dialog:
    For each field where A and B differ:
      Name:  (*) Mohammed Hassan [A]  ( ) Muhammad Hassan [B]
      Email: ( ) m.hassan@gov.eg [A]  (*) mhassan@gmail.com [B]
      Photo: (*) [A's photo]          ( ) [B's photo]

  --> Execute merge:
    1. Update surviving record (A) with resolved field values
    2. Move all Approval records from B --> A
    3. Move all AccessLog records from B --> A
    4. Move all document uploads from B --> A
    5. Update DelegationQuota.usedQuota (decrement for B's delegation)
    6. Create MergeHistory record for audit trail
    7. Soft-delete participant B (retain for audit, exclude from queries)
    8. DuplicateCandidate.status --> MERGED
```

| System            | Integration                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| Registration      | Every registration triggers duplicate + blacklist check before workflow entry |
| Workflow Engine   | Flagged registrations held outside workflow until review                      |
| Bulk Operations   | CSV imports run batch duplicate + blacklist screening                         |
| Communication Hub | Notifications sent to admin on flags                                          |
| Delegation Portal | Duplicate within same delegation flagged to focal point                       |
| Audit Trail       | All merge operations and blacklist overrides logged                           |
| Analytics         | Duplicate rates and blacklist hit rates reported                              |

### 5.6 Audit System

#### 5.6.1 Audit Event Catalog

| Action                      | Severity | Entity Type | Retention | Description                          |
| --------------------------- | -------- | ----------- | --------- | ------------------------------------ |
| `LOGIN`                     | INFO     | USER        | 1 year    | Successful login                     |
| `LOGIN_FAILED`              | WARN     | USER        | 1 year    | Failed login attempt                 |
| `LOGOUT`                    | INFO     | USER        | 90 days   | User logout                          |
| `TWO_FACTOR_SETUP`          | INFO     | USER        | 1 year    | 2FA enabled                          |
| `TWO_FACTOR_VERIFIED`       | INFO     | USER        | 90 days   | 2FA code verified                    |
| `TWO_FACTOR_FAILED`         | WARN     | USER        | 1 year    | Invalid 2FA code                     |
| `PASSWORD_CHANGED`          | INFO     | USER        | 1 year    | Password changed                     |
| `PASSWORD_RESET_REQUESTED`  | INFO     | USER        | 1 year    | Reset link sent                      |
| `PASSWORD_RESET_COMPLETED`  | INFO     | USER        | 1 year    | Password reset completed             |
| `ACCOUNT_LOCKED`            | HIGH     | USER        | 2 years   | Account locked after failed attempts |
| `ACCOUNT_UNLOCKED`          | INFO     | USER        | 2 years   | Account unlocked by admin            |
| `USER_CREATED`              | INFO     | USER        | 2 years   | New user account                     |
| `USER_UPDATED`              | INFO     | USER        | 1 year    | User profile updated                 |
| `USER_DELETED`              | HIGH     | USER        | 5 years   | User soft-deleted                    |
| `USER_ROLE_ASSIGNED`        | INFO     | USER        | 2 years   | Role granted                         |
| `USER_ROLE_REMOVED`         | INFO     | USER        | 2 years   | Role revoked                         |
| `USER_EVENT_ACCESS_GRANTED` | INFO     | USER        | 1 year    | Event access granted                 |
| `USER_EVENT_ACCESS_REVOKED` | INFO     | USER        | 1 year    | Event access revoked                 |
| `USER_IMPERSONATED`         | HIGH     | USER        | 5 years   | Admin impersonation started          |
| `PARTICIPANT_CREATED`       | INFO     | PARTICIPANT | 2 years   | New registration                     |
| `PARTICIPANT_UPDATED`       | INFO     | PARTICIPANT | 1 year    | Data modified                        |
| `PARTICIPANT_DELETED`       | HIGH     | PARTICIPANT | 5 years   | Participant removed                  |
| `PARTICIPANT_IMPORTED`      | INFO     | PARTICIPANT | 2 years   | Bulk import                          |
| `STEP_APPROVED`             | INFO     | STEP        | 2 years   | Workflow step approved               |
| `STEP_REJECTED`             | INFO     | STEP        | 2 years   | Workflow step rejected               |
| `STEP_BYPASSED`             | WARN     | STEP        | 2 years   | Workflow step bypassed               |
| `BATCH_APPROVED`            | INFO     | STEP        | 2 years   | Batch approval action                |
| `BATCH_REJECTED`            | INFO     | STEP        | 2 years   | Batch rejection action               |
| `SLA_BREACHED`              | WARN     | STEP        | 1 year    | Step exceeded SLA                    |
| `BADGE_PRINTED`             | INFO     | BADGE       | 1 year    | Badge printed                        |
| `BADGE_REPRINTED`           | WARN     | BADGE       | 2 years   | Badge reprinted                      |
| `BADGE_COLLECTED`           | INFO     | BADGE       | 1 year    | Badge collected                      |
| `EVENT_CREATED`             | INFO     | EVENT       | 2 years   | New event                            |
| `EVENT_UPDATED`             | INFO     | EVENT       | 1 year    | Event modified                       |
| `EVENT_PUBLISHED`           | INFO     | EVENT       | 2 years   | Event made live                      |
| `EVENT_CANCELED`            | HIGH     | EVENT       | 5 years   | Event canceled                       |
| `SUSPICIOUS_REQUEST`        | HIGH     | SYSTEM      | 2 years   | Blocked suspicious request           |
| `RATE_LIMIT_EXCEEDED`       | WARN     | SYSTEM      | 90 days   | Rate limit triggered                 |
| `BLACKLIST_HIT`             | HIGH     | BLACKLIST   | 5 years   | Registration matched blacklist       |
| `BLACKLIST_OVERRIDE`        | HIGH     | BLACKLIST   | 5 years   | Blacklist match overridden           |
| `BLACKLIST_ENTRY_ADDED`     | INFO     | BLACKLIST   | 2 years   | New blacklist entry                  |
| `BLACKLIST_ENTRY_REMOVED`   | INFO     | BLACKLIST   | 2 years   | Blacklist entry deactivated          |
| `DUPLICATE_DETECTED`        | WARN     | PARTICIPANT | 2 years   | Duplicate candidate found            |
| `DUPLICATE_MERGED`          | INFO     | PARTICIPANT | 5 years   | Participant records merged           |
| `API_KEY_CREATED`           | INFO     | API_KEY     | 2 years   | New API key generated                |
| `API_KEY_REVOKED`           | INFO     | API_KEY     | 2 years   | API key revoked                      |
| `API_KEY_ROTATED`           | INFO     | API_KEY     | 2 years   | API key rotated                      |
| `BULK_EXPORT`               | INFO     | SYSTEM      | 1 year    | Data export triggered                |
| `DATA_ERASURE_REQUESTED`    | HIGH     | USER        | 5 years   | GDPR erasure request                 |
| `DATA_ERASURE_COMPLETED`    | HIGH     | USER        | 5 years   | Erasure completed                    |
| `SETTINGS_UPDATED`          | INFO     | SETTING     | 1 year    | System settings changed              |

#### 5.6.2 Audit Log Structure

```typescript
// app/utils/audit.server.ts

interface AuditLogInput {
  tenantId?: string;
  userId?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      metadata: input.metadata ?? undefined,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

// Helper to extract request context for audit logging
export function getRequestContext(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}

// Usage in a route action
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserWithPermission(request, {
    entity: "participant",
    action: "approve",
  });
  const { ipAddress, userAgent } = getRequestContext(request);

  // ... perform approval logic ...

  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "STEP_APPROVED",
    entityType: "STEP",
    entityId: stepId,
    description: `Approved participant ${participantId} at step ${stepName}`,
    metadata: {
      participantId,
      stepId,
      previousStatus: "PENDING",
      newStatus: "APPROVED",
    },
    ipAddress,
    userAgent,
  });
}
```

#### 5.6.3 Audit Retention & Archival

Audit logs are retained based on the severity/retention rules defined in the Audit Event Catalog (Section 5.6.1). A nightly background job handles archival:

1. **Hot storage** (PostgreSQL): Logs from the last 90 days are queryable via the admin UI.
2. **Warm storage** (compressed JSON in Azure Blob): Logs older than 90 days are exported, compressed, and stored in tenant-scoped blob containers.
3. **Deletion**: Logs past their retention period are permanently deleted. A `DATA_ERASURE_COMPLETED` audit log is always the last record written before deletion of a batch.

```typescript
// Background job: audit log archival
export async function archiveOldAuditLogs(): Promise<void> {
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const logsToArchive = await prisma.auditLog.findMany({
    where: { createdAt: { lt: cutoffDate } },
    take: 10000, // Process in batches
    orderBy: { createdAt: "asc" },
  });

  if (logsToArchive.length === 0) return;

  // Group by tenant for organized storage
  const byTenant = groupBy(logsToArchive, "tenantId");

  for (const [tenantId, logs] of Object.entries(byTenant)) {
    const compressed = gzipSync(JSON.stringify(logs));
    const blobName = `audit/${tenantId}/${format(cutoffDate, "yyyy-MM")}.json.gz`;
    await uploadToAzureBlob(blobName, compressed);
  }

  // Delete archived records
  const archivedIds = logsToArchive.map((l) => l.id);
  await prisma.auditLog.deleteMany({
    where: { id: { in: archivedIds } },
  });
}
```

### 5.7 API Key Management

#### 5.7.1 Key Generation & Rotation

API keys are generated using `crypto.randomBytes` and only the SHA-256 hash is stored in the database. The plaintext key is displayed once at creation time and cannot be retrieved afterward.

```typescript
// app/utils/api-keys.server.ts

import crypto from "node:crypto";

const API_KEY_PREFIX = "ak_";
const KEY_BYTE_LENGTH = 32;

export async function generateApiKey(
  tenantId: string,
  name: string,
  permissions: string[],
  eventIds: string[],
  createdBy: string,
  expiresAt?: Date,
): Promise<{ key: string; keyId: string }> {
  const rawKey = crypto.randomBytes(KEY_BYTE_LENGTH).toString("hex");
  const fullKey = `${API_KEY_PREFIX}${rawKey}`;
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");
  const keyPrefix = fullKey.substring(0, 11); // "ak_" + first 8 hex chars

  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId,
      name,
      keyHash,
      keyPrefix,
      permissions,
      eventIds,
      expiresAt,
      createdBy,
    },
  });

  await createAuditLog({
    tenantId,
    userId: createdBy,
    action: "API_KEY_CREATED",
    entityType: "API_KEY",
    entityId: apiKey.id,
    description: `API key "${name}" created with prefix ${keyPrefix}`,
    metadata: { permissions, eventIds },
  });

  return { key: fullKey, keyId: apiKey.id };
}
```

**Rotation without downtime:** When rotating, a new key is generated and the old key is marked with a grace period (default: 24 hours). Both keys remain valid during the grace period, after which the old key is automatically deactivated.

#### 5.7.2 Key Scoping

Each API key can be scoped along three dimensions:

1. **Tenant** -- every key is bound to exactly one tenant (enforced by `tenantId` FK).
2. **Events** -- the `eventIds` array limits the key to specific events. An empty array means all events within the tenant.
3. **Actions** -- the `permissions` JSON array lists allowed operations (e.g., `["participants:read", "events:read"]`).

```typescript
// API key authentication middleware
export async function authenticateApiKey(
  request: Request,
): Promise<{ tenantId: string; permissions: string[]; eventIds: string[] }> {
  const apiKeyHeader = request.headers.get("X-API-Key");
  if (!apiKeyHeader) throw new Response("API key required", { status: 401 });

  const keyHash = crypto.createHash("sha256").update(apiKeyHeader).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });

  if (!apiKey || !apiKey.isActive) {
    throw new Response("Invalid API key", { status: 401 });
  }
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    throw new Response("API key expired", { status: 401 });
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    tenantId: apiKey.tenantId,
    permissions: apiKey.permissions as string[],
    eventIds: apiKey.eventIds,
  };
}
```

#### 5.7.3 Key Revocation

Keys can be revoked immediately by setting `isActive = false`. Revoked keys return HTTP 401 on the next request. A revoked key cannot be reactivated -- a new key must be generated instead.

---

## 6. User Interface

### 6.1 Login & 2FA Screens

```
+-----------------------------------------------+
|                                                 |
|          Accreditation Platform                  |
|                                                 |
|  +-------------------------------------------+  |
|  | Username                                   |  |
|  +-------------------------------------------+  |
|  +-------------------------------------------+  |
|  | Password                          [eye]    |  |
|  +-------------------------------------------+  |
|  |                                             |  |
|  | [  Forgot password?  ]                      |  |
|  |                                             |  |
|  | [===========  Sign In  ===========]         |  |
|  +-------------------------------------------+  |
|                                                 |
+-----------------------------------------------+

-- After login if 2FA enabled --

+-----------------------------------------------+
|                                                 |
|       Two-Factor Authentication                 |
|                                                 |
|  Enter the 6-digit code from your               |
|  authenticator app.                              |
|                                                 |
|  +---+ +---+ +---+ +---+ +---+ +---+           |
|  | _ | | _ | | _ | | _ | | _ | | _ |           |
|  +---+ +---+ +---+ +---+ +---+ +---+           |
|                                                 |
|  [===========  Verify  ===========]             |
|                                                 |
|  [Use backup code instead]                      |
|                                                 |
+-----------------------------------------------+
```

### 6.2 Role Management Interface

A table listing all roles with inline editing. Each row shows the role name, scope badge (GLOBAL / TENANT / EVENT), number of assigned users, and a count of granted permissions. Clicking a role expands to show the full permission matrix as checkboxes.

### 6.3 Permission Matrix Editor

A grid view where rows represent entities (Participant, Event, Workflow, etc.) and columns represent actions (create, read, update, delete, approve, print, collect, export). Each cell contains a checkbox. The matrix is read from the `Permission` table and changes are saved via bulk update.

### 6.4 Audit Log Viewer

A filterable, sortable table with these columns: Timestamp, User, Action, Entity Type, Entity ID, Description, IP Address. Filter controls include:

- Action type dropdown (multi-select)
- Entity type dropdown
- Date range picker
- User search (autocomplete)
- Free-text search on description

Export to CSV is available via the `/admin/audit-logs/export` endpoint.

### 6.5 Blacklist Management Screen

```
+------------------------------------------------------------------+
|  Blacklist Management              [+ Add Entry]  [Import CSV]    |
+------------------------------------------------------------------+
| Search: [___________________]  Type: [All v]  Status: [Active v] |
+------------------------------------------------------------------+
| Type         | Name              | Passport  | Reason        | Exp|
+------------------------------------------------------------------+
| INDIVIDUAL   | Mohammed Ali      | AB123456  | Security risk | -- |
| INDIVIDUAL   | Jane Smith        | CD789012  | Fraud         | 06 |
| ORGANIZATION | Acme Corp         | --        | Sanctions     | -- |
+------------------------------------------------------------------+
| [Export CSV]                                    Page 1 of 3  [>] |
+------------------------------------------------------------------+
```

### 6.6 API Key Management Screen

Displays a table of all API keys for the tenant. Columns: Name, Key Prefix, Permissions (tags), Events (count or "All"), Last Used, Expires, Status. Actions: Create, Rotate, Revoke. The "Create" dialog shows the full key exactly once with a copy-to-clipboard button and a warning that the key cannot be retrieved again.

---

## 7. Integration Points

### 7.1 Authentication Middleware

Every module uses the authentication guards as the first call in their route loaders and actions.

```typescript
// Pattern used by all modules
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  // user is guaranteed to be authenticated and the session is valid
  // user.tenantId is used to scope all subsequent queries
}
```

### 7.2 Authorization Hooks

Modules check permissions using `requireUserWithPermission` for entity-level access and `requireEventAccess` for event-scoped operations.

```typescript
// Module: Badge Printing
export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireEventAccess(request, params.eventId, "printer");
  // user is confirmed to have printer role for this event
}

// Module: Workflow Configuration
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserWithPermission(request, {
    entity: "workflow",
    action: "update",
  });
  // user has workflow update permission (GLOBAL or TENANT scope)
}
```

### 7.3 Audit Integration

Every module emits audit events by calling `createAuditLog` after performing state changes. The audit function is fire-and-forget (errors are logged but do not block the primary operation).

```typescript
// Pattern for audit integration in any module
try {
  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "BADGE_PRINTED",
    entityType: "BADGE",
    entityId: participantId,
    description: `Badge printed for ${participantName}`,
    metadata: { eventId, templateId },
    ...getRequestContext(request),
  });
} catch (error) {
  logger.error({ error }, "Failed to write audit log");
}
```

### 7.4 Rate Limiting Integration

Modules that expose public-facing endpoints (registration forms, API routes) inherit the Express-level rate limiting automatically. The API layer applies per-key rate limiting for external integrations by checking the `rateLimit` field on the `ApiKey` record.

---

## 8. Configuration

### 8.1 Security Settings Keys

| Key                             | Label                | Default | Type    | Description                                            |
| ------------------------------- | -------------------- | ------- | ------- | ------------------------------------------------------ |
| `auth.maxLoginAttempts`         | Max Login Attempts   | 5       | NUMBER  | Failed attempts before lockout                         |
| `auth.lockoutDurationMinutes`   | Lockout Duration     | 30      | NUMBER  | Minutes locked out after max attempts                  |
| `auth.autoResetAfterMinutes`    | Auto Reset           | 60      | NUMBER  | Minutes until failed attempt counter resets            |
| `auth.maxLockCount`             | Max Lock Count       | 3       | NUMBER  | Lockouts before permanent lock (admin unlock required) |
| `auth.sessionExpirationDays`    | Session Expiration   | 30      | NUMBER  | Days until session expires                             |
| `auth.inactivityTimeoutMinutes` | Inactivity Timeout   | 60      | NUMBER  | Minutes of inactivity before forced logout             |
| `auth.bcryptSaltRounds`         | Bcrypt Salt Rounds   | 10      | NUMBER  | Password hashing strength                              |
| `auth.requireTwoFactor`         | Require 2FA          | false   | BOOLEAN | Force 2FA for all users                                |
| `auth.passwordMinLength`        | Min Password Length  | 8       | NUMBER  | Minimum password characters                            |
| `auth.passwordRequireSpecial`   | Require Special Char | true    | BOOLEAN | Require special characters in passwords                |

### 8.2 CSP Configuration

CSP directives are configured at the Express middleware level (Section 2.4). Environment-specific overrides:

| Environment | `img-src` Addition     | `connect-src` Addition   |
| ----------- | ---------------------- | ------------------------ |
| Development | `localhost:*`          | `ws://localhost:*` (HMR) |
| Staging     | Staging storage URL    | Staging API URL          |
| Production  | Production storage URL | --                       |

### 8.3 Rate Limiting Configuration

| Key                            | Default | Description                       |
| ------------------------------ | ------- | --------------------------------- |
| `rateLimit.general.max`        | 100     | Max requests per minute (general) |
| `rateLimit.general.windowMs`   | 60000   | Window in milliseconds            |
| `rateLimit.mutations.max`      | 50      | Max mutation requests per minute  |
| `rateLimit.auth.max`           | 10      | Max auth requests per minute      |
| `rateLimit.api.defaultPerHour` | 1000    | Default API key rate limit        |

### 8.4 Session Configuration

| Key                  | Default       | Description                  |
| -------------------- | ------------- | ---------------------------- |
| `session.cookieName` | `__session`   | Cookie name                  |
| `session.sameSite`   | `lax`         | SameSite cookie attribute    |
| `session.secure`     | `true` (prod) | Secure flag (HTTPS only)     |
| `session.httpOnly`   | `true`        | HttpOnly flag (no JS access) |

### 8.5 Password Policy Configuration

| Key                         | Default | Description                              |
| --------------------------- | ------- | ---------------------------------------- |
| `password.minLength`        | 8       | Minimum characters                       |
| `password.requireUppercase` | true    | At least one uppercase letter            |
| `password.requireLowercase` | true    | At least one lowercase letter            |
| `password.requireNumbers`   | true    | At least one digit                       |
| `password.requireSpecial`   | true    | At least one special character           |
| `password.maxAge`           | 0       | Days before password expires (0 = never) |
| `password.preventReuse`     | 5       | Number of previous passwords to check    |

---

## 9. Testing Strategy

### 9.1 Authentication Tests

```typescript
// __tests__/auth/login.test.ts

describe("Authentication", () => {
  it("should create a session on valid credentials", async () => {
    const response = await login({ username: "admin", password: "validPass123!" });
    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("should return 401 on invalid credentials", async () => {
    const response = await login({ username: "admin", password: "wrong" });
    expect(response.status).toBe(401);
    expect(response.body.remainingAttempts).toBe(4);
  });

  it("should lock account after max failed attempts", async () => {
    for (let i = 0; i < 5; i++) {
      await login({ username: "admin", password: "wrong" });
    }
    const response = await login({ username: "admin", password: "validPass123!" });
    expect(response.status).toBe(423);
    expect(response.body.unlockAt).toBeDefined();
  });

  it("should require 2FA when enabled", async () => {
    await enableTwoFactor("admin");
    const response = await login({ username: "admin", password: "validPass123!" });
    expect(response.body.requires2FA).toBe(true);
  });

  it("should regenerate session ID after 2FA verification", async () => {
    const loginResponse = await login({ username: "admin", password: "validPass123!" });
    const sessionBefore = getSessionCookie(loginResponse);
    const verifyResponse = await verify2FA({ code: generateTOTP() });
    const sessionAfter = getSessionCookie(verifyResponse);
    expect(sessionBefore).not.toBe(sessionAfter);
  });
});
```

### 9.2 Authorization Tests

```typescript
// __tests__/auth/authorization.test.ts

describe("Authorization - Permission Boundaries", () => {
  it("should allow tenant admin to manage own tenant users", async () => {
    const response = await asUser("tenantAdmin").get("/admin/users");
    expect(response.status).toBe(200);
    // All returned users belong to the same tenant
    response.body.data.forEach((user: any) => {
      expect(user.tenantId).toBe(tenantAdmin.tenantId);
    });
  });

  it("should deny tenant admin access to other tenant data", async () => {
    const response = await asUser("tenantAdminA").get(`/events/${tenantBEventId}`);
    expect(response.status).toBe(403);
  });

  it("should restrict validator to assigned steps only", async () => {
    // Validator has access to step 3 only
    const allowedResponse = await asUser("validator").get(
      `/events/${eventId}/steps/${step3Id}/queue`,
    );
    expect(allowedResponse.status).toBe(200);

    const deniedResponse = await asUser("validator").get(
      `/events/${eventId}/steps/${step4Id}/queue`,
    );
    expect(deniedResponse.status).toBe(403);
  });

  it("should prevent IDOR on participant records", async () => {
    // Validator in event A tries to approve participant in event B
    const response = await asUser("validatorEventA").post(
      `/events/${eventBId}/participants/${participantBId}/approve`,
    );
    expect(response.status).toBe(403);
  });

  it("should enforce tenant isolation on all queries", async () => {
    const participants = await asUser("tenantAdminA").get("/participants");
    participants.body.data.forEach((p: any) => {
      expect(p.tenantId).toBe(tenantA.id);
    });
  });
});
```

### 9.3 Penetration Testing Guidelines

The following test scenarios should be executed during security reviews:

**Tenant Isolation Bypass:**

- Attempt to access resources by manipulating `tenantId` in URL parameters, request bodies, and cookies.
- Verify that all Prisma queries include `tenantId` from the authenticated user, never from the request.
- Test cross-tenant API key usage (key from Tenant A used against Tenant B endpoints).

**Privilege Escalation:**

- Attempt to assign GLOBAL scope roles via the tenant admin interface.
- Test modifying role permissions by directly calling the API with a lower-privilege session.
- Verify that deleting a role immediately revokes all associated permissions for active sessions.

**Session Fixation:**

- Verify session ID changes after successful 2FA verification.
- Test that old session IDs are invalidated after regeneration.
- Attempt to reuse a logged-out session ID.

**Insecure Direct Object Reference (IDOR):**

- Enumerate participant IDs across events and tenants.
- Test accessing audit logs from other tenants.
- Verify that file download URLs include tenant-scoped authorization.

**Injection Attacks:**

- Test XSS payloads in participant name, organization, and custom field values.
- Verify CSP blocks inline script execution.
- Test SQL injection via custom field search queries (raw SQL with JSONB).

### 9.4 Security Regression Tests

A dedicated test suite runs on every CI build to ensure security controls are not accidentally weakened:

```typescript
describe("Security Regression", () => {
  it("should set all security headers", async () => {
    const response = await fetch("/");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(response.headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  it("should not expose stack traces in production errors", async () => {
    const response = await fetch("/api/v1/nonexistent");
    expect(response.body).not.toContain("at ");
    expect(response.body).not.toContain("node_modules");
  });

  it("should enforce CSRF on state-changing requests", async () => {
    const response = await fetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "a", password: "b" }),
      headers: { "Content-Type": "application/json" },
      // No CSRF token
    });
    expect(response.status).toBe(403);
  });

  it("should rate limit auth endpoints", async () => {
    const requests = Array.from({ length: 15 }, () =>
      fetch("/auth/login", { method: "POST", body: "{}" }),
    );
    const responses = await Promise.all(requests);
    const tooMany = responses.filter((r) => r.status === 429);
    expect(tooMany.length).toBeGreaterThan(0);
  });
});
```

---

## 10. Security Considerations

### 10.1 OWASP Top 10 Mitigation Matrix

| #   | OWASP Category                                 | Platform Mitigation                                                                                                                                                                                                                       |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | **Broken Access Control**                      | RBAC with three scope levels; tenant isolation via mandatory `tenantId` FK on every record; `requireUser`, `requirePermission`, `requireEventAccess` guards on every route; composite unique constraints prevent cross-tenant duplication |
| A02 | **Cryptographic Failures**                     | bcrypt for passwords (configurable salt rounds); AES-256 for backup encryption; HTTPS enforced via HSTS; session cookies are HttpOnly + Secure + SameSite; API key hashed with SHA-256 (plaintext never stored)                           |
| A03 | **Injection**                                  | Prisma ORM parameterizes all queries; raw SQL for JSONB uses `$queryRaw` with tagged template literals (auto-escaped); user input sanitized with `xss` + `DOMPurify`; CSP blocks inline scripts                                           |
| A04 | **Insecure Design**                            | Threat model documented (Section 1.4); defense-in-depth layering; security requirements included in feature specs; duplicate detection and blacklist screening built into registration flow                                               |
| A05 | **Security Misconfiguration**                  | Helmet auto-sets security headers; `.env.example` with placeholders (no real secrets in repo); Docker image scanned with Trivy in CI; production error pages suppress stack traces                                                        |
| A06 | **Vulnerable and Outdated Components**         | `npm audit` in CI pipeline; Dependabot for automated dependency updates; Node.js 20 LTS; PostgreSQL 16 with latest security patches                                                                                                       |
| A07 | **Identification and Authentication Failures** | Progressive lockout; optional TOTP 2FA; session fingerprinting (User-Agent + sec-ch-ua); session regeneration after privilege changes; configurable password complexity                                                                   |
| A08 | **Software and Data Integrity Failures**       | CSRF tokens on all state-changing requests; Subresource Integrity (SRI) hashes on CDN scripts (if used); Docker images signed; CI/CD pipeline requires manual approval for production deploys                                             |
| A09 | **Security Logging and Monitoring Failures**   | Comprehensive audit log (50+ event types); structured JSON logging via Pino; Sentry for real-time error tracking; Azure Application Insights for APM; suspicious request logging                                                          |
| A10 | **Server-Side Request Forgery**                | No user-controlled URL fetching; Azure Blob Storage access via SDK with managed credentials; webhook URLs validated against allowlist; internal services not exposed to user input                                                        |

### 10.2 GDPR Compliance

**Right to Erasure (Article 17):**

When a data subject requests erasure, the platform executes the following process:

```typescript
export async function processErasureRequest(
  participantId: string,
  requestedBy: string,
): Promise<void> {
  const participant = await prisma.participant.findUniqueOrThrow({
    where: { id: participantId },
    include: { documents: true },
  });

  await prisma.$transaction(async (tx) => {
    // 1. Anonymize participant record (retain for aggregate statistics)
    await tx.participant.update({
      where: { id: participantId },
      data: {
        firstName: "REDACTED",
        lastName: "REDACTED",
        email: `redacted-${participantId}@erased.local`,
        phone: null,
        passportNumber: null,
        dateOfBirth: null,
        nationality: null,
        customData: {},
        deletedAt: new Date(),
      },
    });

    // 2. Delete uploaded documents from Azure Blob Storage
    for (const doc of participant.documents) {
      await deleteBlob(doc.blobPath);
      await tx.participantDocument.delete({ where: { id: doc.id } });
    }

    // 3. Delete user photo
    if (participant.photoPath) {
      await deleteBlob(participant.photoPath);
    }

    // 4. Anonymize related audit logs (keep structure, remove PII)
    await tx.auditLog.updateMany({
      where: { entityType: "PARTICIPANT", entityId: participantId },
      data: {
        description: "REDACTED per GDPR erasure request",
        metadata: {},
      },
    });

    // 5. Log the erasure itself
    await tx.auditLog.create({
      data: {
        action: "DATA_ERASURE_COMPLETED",
        entityType: "PARTICIPANT",
        entityId: participantId,
        description: "GDPR erasure request fulfilled",
        userId: requestedBy,
        tenantId: participant.tenantId,
      },
    });
  });
}
```

**Data Portability (Article 20):**

Participants can request a machine-readable export of all their data. The platform generates a JSON archive containing: personal data, registration history, approval records, uploaded documents, and consent records.

**Consent Management:**

The `ConsentRecord` model (defined in Module 01) tracks explicit consent for data processing, photo usage, communication, and badge display. Each consent is versioned against the privacy policy version. Consent can be withdrawn at any time, and withdrawal triggers appropriate data handling (e.g., removing a photo from the badge if PHOTO_USAGE consent is revoked).

**Breach Notification:**

In the event of a data breach, the platform supports:

1. Identifying affected records via audit log analysis.
2. Generating a list of affected data subjects for notification (required within 72 hours under GDPR).
3. Documenting the breach, its scope, and remediation steps in the audit log.

### 10.3 Encryption

| Layer                      | Method                   | Details                                                               |
| -------------------------- | ------------------------ | --------------------------------------------------------------------- |
| **In Transit**             | TLS 1.2+                 | Enforced via HSTS with preload; Azure Load Balancer terminates TLS    |
| **At Rest (Database)**     | Azure-managed encryption | PostgreSQL on Azure uses transparent data encryption (TDE)            |
| **At Rest (Backups)**      | AES-256                  | SQL dump files encrypted before upload to Azure Blob Storage          |
| **At Rest (Blob Storage)** | Azure SSE                | Azure Storage Service Encryption with Microsoft-managed keys          |
| **Passwords**              | bcrypt                   | One-way hash with configurable cost factor (default: 10 rounds)       |
| **API Keys**               | SHA-256                  | Stored as hash; plaintext shown once at creation                      |
| **2FA Secrets**            | AES-256-GCM              | TOTP secrets encrypted in the database using app-level encryption key |

### 10.4 Input Validation & Sanitization

All user input passes through two layers:

1. **Schema Validation (Zod):** Every form submission and API request is validated against a Zod schema. Invalid data is rejected with a 400 response before reaching business logic.

2. **Sanitization (xss + DOMPurify):** Text fields that might be rendered in HTML (names, descriptions, remarks) are sanitized to strip any embedded scripts or HTML tags.

```typescript
import { z } from "zod";
import xss from "xss";

const ParticipantSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(100)
    .transform((v) => xss(v)),
  lastName: z
    .string()
    .min(1)
    .max(100)
    .transform((v) => xss(v)),
  email: z.string().email().max(255),
  passportNumber: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
});
```

### 10.5 XSS Prevention

- **CSP nonces** block all inline scripts not bearing the per-request nonce.
- **DOMPurify** sanitizes any user-generated content before rendering.
- **React** auto-escapes JSX expressions by default.
- **Radix UI** components do not use `dangerouslySetInnerHTML`.
- **Audit log viewer** renders metadata as pre-formatted text, never as HTML.

### 10.6 CSRF Protection

CSRF protection is implemented using the double-submit cookie pattern via `react-router-utils`:

1. A CSRF token is generated per session and stored in both a cookie and the page (via a hidden form field or meta tag).
2. On every non-GET request, the middleware compares the cookie token with the form-submitted token.
3. Mismatches result in a 403 Forbidden response.

```typescript
// Root loader provides CSRF token to all pages
export async function loader({ request }: LoaderFunctionArgs) {
  const csrfToken = generateCSRFToken(request);
  return json({ csrfToken });
}

// Every form includes the CSRF token
export function CSRFInput() {
  const { csrfToken } = useLoaderData<typeof loader>();
  return <input type="hidden" name="_csrf" value={csrfToken} />;
}
```

### 10.7 SQL Injection Prevention

The primary defense is Prisma ORM, which parameterizes all queries automatically. For raw SQL queries (used for JSONB aggregations on custom fields), the platform uses Prisma's `$queryRaw` with tagged template literals, which auto-escape interpolated values:

```typescript
// Safe: tagged template literal auto-escapes
const results = await prisma.$queryRaw`
  SELECT id, "customData"->>${fieldName} as value
  FROM "Participant"
  WHERE "tenantId" = ${tenantId}
  AND "customData"->>'{fieldName}' = ${searchValue}
`;

// Never used: string concatenation (vulnerable)
// const results = await prisma.$queryRawUnsafe(`SELECT * FROM ... WHERE name = '${input}'`);
```

---

## 11. Performance Requirements

### 11.1 Authentication Latency Targets

| Operation                     | Target  | Notes                              |
| ----------------------------- | ------- | ---------------------------------- |
| Login (password verification) | < 300ms | bcrypt with 10 rounds takes ~100ms |
| Session validation            | < 20ms  | Database lookup by primary key     |
| 2FA verification              | < 50ms  | TOTP computation is CPU-bound      |
| Session regeneration          | < 50ms  | Delete + create in transaction     |

### 11.2 Authorization Check Overhead

| Operation                                 | Target | Notes                                                             |
| ----------------------------------------- | ------ | ----------------------------------------------------------------- |
| Permission check (`userHasPermission`)    | < 5ms  | Roles and permissions loaded with session (cached on user object) |
| Event access check (`requireEventAccess`) | < 10ms | `UserEventAccess` loaded with user session                        |
| Full auth guard stack                     | < 30ms | Session validation + permission check combined                    |

### 11.3 Audit Log Write Performance

| Operation                            | Target  | Notes                                        |
| ------------------------------------ | ------- | -------------------------------------------- |
| Single audit log write               | < 10ms  | Async insert, non-blocking                   |
| Batch audit (100 records)            | < 200ms | Bulk insert in single transaction            |
| Audit log query (paginated, 50 rows) | < 100ms | Indexed on `tenantId`, `action`, `createdAt` |
| Audit export (10,000 records)        | < 5s    | Streaming CSV response                       |

---

## 12. Open Questions & Decisions

| #   | Question                                                                            | Status   | Decision                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Should API keys support IP allowlisting?                                            | OPEN     | Would add security but complicates deployment                                                                                                             |
| 2   | Should audit logs use a separate database for write performance?                    | DEFERRED | Start with same database; evaluate if write volume exceeds 1M records/month                                                                               |
| 3   | Should the platform support SSO (SAML/OIDC) for tenant users?                       | OPEN     | Useful for large organizations; adds complexity to auth flow                                                                                              |
| 4   | Should password rotation be enforced (e.g., every 90 days)?                         | DECIDED  | No -- NIST SP 800-63B recommends against periodic rotation unless compromise is suspected; `password.maxAge` is configurable but defaults to 0 (disabled) |
| 5   | Should the blacklist support real-time external API lookups (UN sanctions list)?    | OPEN     | Would improve coverage but introduces network dependency in the registration flow                                                                         |
| 6   | How long should the API key rotation grace period be?                               | DECIDED  | 24 hours -- sufficient for CI/CD pipelines to update secrets                                                                                              |
| 7   | Should session cookies use `SameSite=Strict` instead of `Lax`?                      | DECIDED  | `Lax` -- allows top-level navigation (links from email) while still preventing CSRF                                                                       |
| 8   | Should the platform implement Content-Security-Policy-Report-Only before enforcing? | OPEN     | Recommended for initial rollout to catch false positives                                                                                                  |

---

## Appendix

### A. Complete Permission Catalog

Every permission in the system follows the pattern `{action}:{entity}:{access}`.

```
# Tenant Management
create:tenant:global
read:tenant:global
read:tenant:tenant
update:tenant:global
update:tenant:tenant
delete:tenant:global

# User Management
create:user:global
create:user:tenant
read:user:global
read:user:tenant
update:user:global
update:user:tenant
delete:user:global
delete:user:tenant
export:user:global
export:user:tenant
import:user:global
import:user:tenant

# Role Management
create:role:global
create:role:tenant
read:role:global
read:role:tenant
update:role:global
update:role:tenant
delete:role:global
delete:role:tenant

# Permission Management
create:permission:global
read:permission:global
read:permission:tenant
update:permission:global
delete:permission:global

# Event Management
create:event:global
create:event:tenant
read:event:global
read:event:tenant
read:event:event
update:event:global
update:event:tenant
delete:event:global
delete:event:tenant
export:event:global
export:event:tenant

# Participant Management
create:participant:global
create:participant:tenant
create:participant:event       # focal point
read:participant:global
read:participant:tenant
read:participant:event
update:participant:global
update:participant:tenant
update:participant:event       # validator edits
delete:participant:global
delete:participant:tenant
approve:participant:event      # validator
reject:participant:event       # validator
print:participant:event        # printer
collect:participant:event      # dispatcher
export:participant:global
export:participant:tenant
import:participant:global
import:participant:tenant

# Workflow Management
create:workflow:global
create:workflow:tenant
read:workflow:global
read:workflow:tenant
read:workflow:event
update:workflow:global
update:workflow:tenant
delete:workflow:global
delete:workflow:tenant

# Template Management (Badge, Form, Email)
create:template:global
create:template:tenant
read:template:global
read:template:tenant
read:template:event
update:template:global
update:template:tenant
delete:template:global
delete:template:tenant

# Invitation & Delegation
create:invitation:global
create:invitation:tenant
read:invitation:global
read:invitation:tenant
read:invitation:event          # focal point
update:invitation:global
update:invitation:tenant
delete:invitation:global
delete:invitation:tenant
export:invitation:global
export:invitation:tenant
import:invitation:global
import:invitation:tenant

# Report Management
create:report:global
create:report:tenant
read:report:global
read:report:tenant
read:report:event              # reviewer
update:report:global
update:report:tenant
delete:report:global
delete:report:tenant
export:report:global
export:report:tenant

# Audit Management
read:audit:global
read:audit:tenant
export:audit:global
export:audit:tenant

# Blacklist Management
create:blacklist:global
create:blacklist:tenant
read:blacklist:global
read:blacklist:tenant
update:blacklist:global
update:blacklist:tenant
delete:blacklist:global
delete:blacklist:tenant
export:blacklist:global
export:blacklist:tenant
import:blacklist:global
import:blacklist:tenant

# API Key Management
create:apikey:global
create:apikey:tenant
read:apikey:global
read:apikey:tenant
update:apikey:global
update:apikey:tenant
delete:apikey:global
delete:apikey:tenant

# System Settings
create:setting:global
read:setting:global
read:setting:tenant
update:setting:global
update:setting:tenant
delete:setting:global

# Session Management
read:session:global
read:session:tenant
delete:session:global
delete:session:tenant

# Custom Fields & Objects
create:customfield:global
create:customfield:tenant
read:customfield:global
read:customfield:tenant
read:customfield:event
update:customfield:global
update:customfield:tenant
delete:customfield:global
delete:customfield:tenant

# Saved Views
create:savedview:global
create:savedview:tenant
create:savedview:event
read:savedview:global
read:savedview:tenant
read:savedview:event
update:savedview:own           # only creator can edit
delete:savedview:own           # only creator can delete
```

### B. Audit Event Reference

Quick reference for developers implementing new features:

```typescript
// When you add a new auditable action:
// 1. Add the action to the AuditAction enum in schema.prisma
// 2. Add the entity type to AuditEntityType if needed
// 3. Call createAuditLog in your route action/loader
// 4. Add the action to the Audit Event Catalog (Section 5.6.1)
// 5. Add test coverage in the security regression suite

// Example: Adding a new "CERTIFICATE_ISSUED" audit event
// schema.prisma:
//   Add CERTIFICATE_ISSUED to AuditAction enum
//   CERTIFICATE already exists as AuditEntityType (or add it)
//
// route action:
await createAuditLog({
  tenantId: user.tenantId,
  userId: user.id,
  action: "CERTIFICATE_ISSUED",
  entityType: "CERTIFICATE",
  entityId: certificateId,
  description: `Certificate issued for participant ${name} at event ${eventName}`,
  metadata: {
    participantId,
    eventId,
    templateId,
    certificateNumber,
  },
  ...getRequestContext(request),
});
```

### C. Security Checklist for New Features

Before merging any feature branch, verify the following:

- [ ] **Authentication:** All new routes use `requireUser` or `requireUserWithPermission`.
- [ ] **Authorization:** New entity operations have corresponding permissions in the matrix.
- [ ] **Tenant Isolation:** Every Prisma query includes `tenantId` from the authenticated user.
- [ ] **Input Validation:** All user input is validated with a Zod schema.
- [ ] **Input Sanitization:** Text fields rendered in HTML are sanitized with `xss` or `DOMPurify`.
- [ ] **CSRF:** All forms include the CSRF token hidden field.
- [ ] **Audit Logging:** State-changing operations emit an audit event.
- [ ] **Rate Limiting:** New public endpoints are covered by the appropriate rate limit tier.
- [ ] **Error Handling:** No stack traces, internal paths, or sensitive data in error responses.
- [ ] **File Uploads:** New upload endpoints validate MIME type, size, and scan with ClamAV.
- [ ] **Tests:** Permission boundary tests cover the new entity/action combination.
- [ ] **GDPR:** If handling PII, ensure erasure and portability support.
- [ ] **CSP:** No use of `unsafe-inline` or `unsafe-eval` in any new scripts or styles.
- [ ] **Dependencies:** New npm packages audited for known vulnerabilities (`npm audit`).
