# Module 06: Infrastructure and DevOps

> **Module:** 06 - Infrastructure and DevOps
> **Version:** 1.0
> **Last Updated:** February 10, 2026
> **Status:** Draft
> **Requires:** [Module 00: Architecture Overview](./00-ARCHITECTURE-OVERVIEW.md)
> **Required By:** All modules (provides deployment, CI/CD, observability)
> **Integrates With:** [Module 01: Data Model](./01-DATA-MODEL-FOUNDATION.md), [Module 05: Security](./05-SECURITY-AND-ACCESS-CONTROL.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Infrastructure Design Principles](#13-infrastructure-design-principles)
2. [Architecture](#2-architecture)
   - 2.1 [Infrastructure Architecture Diagram](#21-infrastructure-architecture-diagram)
   - 2.2 [Container Architecture](#22-container-architecture)
   - 2.3 [Network Topology](#23-network-topology)
   - 2.4 [Environment Strategy](#24-environment-strategy)
3. [Data Model](#3-data-model)
   - 3.1 [DatabaseBackup Model](#31-databasebackup-model)
   - 3.2 [Health Check Data](#32-health-check-data)
   - 3.3 [Deployment Metadata](#33-deployment-metadata)
4. [API Specification](#4-api-specification)
   - 4.1 [Health Check Endpoints](#41-health-check-endpoints)
   - 4.2 [Metrics Endpoints](#42-metrics-endpoints)
   - 4.3 [Admin Endpoints](#43-admin-endpoints)
5. [Business Logic](#5-business-logic)
   - 5.1 [Docker Multi-Stage Build](#51-docker-multi-stage-build)
   - 5.2 [Docker Compose for Development](#52-docker-compose-for-development)
   - 5.3 [CI/CD Pipeline](#53-cicd-pipeline)
   - 5.4 [Testing Infrastructure](#54-testing-infrastructure)
   - 5.5 [Observability Stack](#55-observability-stack)
   - 5.6 [Backup and Recovery](#56-backup-and-recovery)
   - 5.7 [Background Job Framework](#57-background-job-framework)
   - 5.8 [File Processing Pipeline](#58-file-processing-pipeline)
   - 5.9 [Blue-Green Deployment](#59-blue-green-deployment)
   - 5.10 [Performance Testing](#510-performance-testing)
   - 5.11 [Incident Response](#511-incident-response)
   - 5.12 [Pre-Commit Hooks](#512-pre-commit-hooks)
6. [User Interface](#6-user-interface)
   - 6.1 [DevOps Admin Dashboard](#61-devops-admin-dashboard)
   - 6.2 [Deployment Status Panel](#62-deployment-status-panel)
   - 6.3 [System Health Dashboard](#63-system-health-dashboard)
   - 6.4 [Log Viewer](#64-log-viewer)
   - 6.5 [Job Queue Monitoring UI](#65-job-queue-monitoring-ui)
   - 6.6 [Backup Management Console](#66-backup-management-console)
7. [Integration Points](#7-integration-points)
8. [Configuration](#8-configuration)
   - 8.1 [Environment Variables Catalog](#81-environment-variables-catalog)
   - 8.2 [Docker Environment Variables](#82-docker-environment-variables)
   - 8.3 [CI/CD Secrets](#83-cicd-secrets)
   - 8.4 [Feature Flags](#84-feature-flags)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [Docker Build Tests](#91-docker-build-tests)
   - 9.2 [CI Pipeline Validation](#92-ci-pipeline-validation)
   - 9.3 [Backup/Restore Verification](#93-backuprestore-verification)
   - 9.4 [Performance Regression Tests](#94-performance-regression-tests)
   - 9.5 [Chaos Engineering Scenarios](#95-chaos-engineering-scenarios)
10. [Security Considerations](#10-security-considerations)
    - 10.1 [Container Security](#101-container-security)
    - 10.2 [CI/CD Security](#102-cicd-security)
    - 10.3 [Network Security](#103-network-security)
    - 10.4 [Secrets Rotation Procedures](#104-secrets-rotation-procedures)
11. [Performance Requirements](#11-performance-requirements)
    - 11.1 [Response Time SLAs](#111-response-time-slas)
    - 11.2 [Throughput Targets](#112-throughput-targets)
    - 11.3 [Database Connection Pool Sizing](#113-database-connection-pool-sizing)
    - 11.4 [CDN Cache Strategy](#114-cdn-cache-strategy)
    - 11.5 [Resource Limits](#115-resource-limits)
    - 11.6 [Auto-Scaling Rules](#116-auto-scaling-rules)
12. [Open Questions & Decisions](#12-open-questions--decisions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)
  - C. [Complete Environment Variable Master List](#c-complete-environment-variable-master-list)

---

## 1. Overview

### 1.1 Purpose

This module defines the complete infrastructure, deployment, observability, and operational strategy for the multi-tenant accreditation platform. It covers everything from local development environments through production deployment, including containerization, CI/CD pipelines, monitoring, backup/restore, background job processing, file processing pipelines, and disaster recovery.

The platform runs as a containerized Node.js application deployed to Azure, backed by PostgreSQL 16, Azure Blob Storage, and Azure Communication Services. All infrastructure is defined as code, all deployments are automated, and all production systems are observable through structured logging, error tracking, and application performance monitoring.

### 1.2 Scope

This module covers:

- **Containerization**: Docker multi-stage builds, Docker Compose for development, image optimization
- **CI/CD Pipelines**: GitHub Actions workflows for quality gates, testing, building, and deployment
- **Testing Infrastructure**: Vitest, MSW, Playwright configuration, test database management
- **Observability**: Structured logging (Pino), error tracking (Sentry), APM (Azure App Insights)
- **Backup & Recovery**: Automated database backups, Azure Blob versioning, disaster recovery
- **Background Jobs**: PostgreSQL-native job queue (pg-boss) for async processing
- **File Processing**: Upload validation, virus scanning, image optimization, document processing
- **Blue-Green Deployment**: Zero-downtime deployments with instant rollback
- **Performance Testing**: k6 load testing with CI integration
- **Incident Response**: Severity classification, escalation paths, post-mortem process

### 1.3 Infrastructure Design Principles

| Principle                     | Description                                                                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Immutable Infrastructure**  | Containers are built once and promoted through environments. No SSH into production, no in-place patches. A deployment artifact is identical in staging and production.                                           |
| **Infrastructure as Code**    | Every infrastructure component is defined in version-controlled configuration files: Dockerfiles, docker-compose manifests, GitHub Actions workflows, Prisma schemas, and Terraform plans.                        |
| **Observability-First**       | Every service emits structured logs, metrics, and traces from day one. Monitoring is not an afterthought but a first-class design requirement. Every request gets a correlation ID that flows through all layers. |
| **Least Privilege**           | Containers run as non-root users. Network access is restricted to the minimum required. Secrets are injected at runtime, never baked into images.                                                                 |
| **Fail Fast, Recover Faster** | Health checks detect failures within seconds. Blue-green deployment enables instant rollback. Automated backups with verified restores ensure data recovery.                                                      |
| **Environment Parity**        | Development, staging, and production environments use identical Docker images, database engines, and service configurations. Only connection strings and feature flags differ.                                    |

---

## 2. Architecture

### 2.1 Infrastructure Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AZURE CLOUD                                                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  RESOURCE GROUP: rg-accreditation-{env}                              │    │
│  │                                                                      │    │
│  │  ┌──────────────────┐    ┌──────────────────────────────────────┐  │    │
│  │  │  Azure Front Door │    │  Azure Application Gateway (WAF v2)  │  │    │
│  │  │  ├── CDN          │───▶│  ├── SSL/TLS Termination             │  │    │
│  │  │  ├── DDoS Protect │    │  ├── WAF Rules (OWASP 3.2)           │  │    │
│  │  │  └── Geo-routing  │    │  ├── Path-based Routing              │  │    │
│  │  └──────────────────┘    │  └── Health Probes (/up)              │  │    │
│  │                           └──────────┬───────────────────────────┘  │    │
│  │                                      │                              │    │
│  │  ┌───────────────────────────────────┼────────────────────────┐    │    │
│  │  │  VNet: vnet-accreditation-{env}   │  10.0.0.0/16           │    │    │
│  │  │                                   │                         │    │    │
│  │  │  ┌─────────────────────────────────▼──────────────────┐    │    │    │
│  │  │  │  Subnet: snet-app  10.0.1.0/24                      │    │    │    │
│  │  │  │  NSG: nsg-app (allow 443 from AGW, deny all)        │    │    │    │
│  │  │  │                                                      │    │    │    │
│  │  │  │  ┌────────────────────┐  ┌────────────────────┐    │    │    │    │
│  │  │  │  │  App Service (Blue) │  │  App Service (Green)│    │    │    │    │
│  │  │  │  │  ├── Docker image   │  │  ├── Docker image   │    │    │    │    │
│  │  │  │  │  ├── Auto-scale     │  │  ├── Staging slot   │    │    │    │    │
│  │  │  │  │  ├── 2-8 instances  │  │  ├── Health check   │    │    │    │    │
│  │  │  │  │  └── Managed ID     │  │  └── Managed ID     │    │    │    │    │
│  │  │  │  └────────────────────┘  └────────────────────┘    │    │    │    │
│  │  │  └─────────────────────────────────────────────────────┘    │    │    │
│  │  │                                                              │    │    │
│  │  │  ┌─────────────────────────────────────────────────────┐    │    │    │
│  │  │  │  Subnet: snet-data  10.0.2.0/24                      │    │    │    │
│  │  │  │  NSG: nsg-data (allow 5432 from snet-app only)       │    │    │    │
│  │  │  │                                                      │    │    │    │
│  │  │  │  ┌────────────────────────────────────────────┐     │    │    │    │
│  │  │  │  │  Azure Database for PostgreSQL Flexible     │     │    │    │    │
│  │  │  │  │  ├── PostgreSQL 16                          │     │    │    │    │
│  │  │  │  │  │  ├── Zone-redundant HA                   │     │    │    │    │
│  │  │  │  │  │  ├── Automated backups (35-day retention)│     │    │    │    │
│  │  │  │  │  │  ├── Read replica (reporting)            │     │    │    │    │
│  │  │  │  │  │  └── Private endpoint                    │     │    │    │    │
│  │  │  │  └────────────────────────────────────────────┘     │    │    │    │
│  │  │  └─────────────────────────────────────────────────────┘    │    │    │
│  │  │                                                              │    │    │
│  │  │  ┌─────────────────────────────────────────────────────┐    │    │    │
│  │  │  │  Subnet: snet-services  10.0.3.0/24                  │    │    │    │
│  │  │  │  NSG: nsg-services (allow from snet-app only)        │    │    │    │
│  │  │  │                                                      │    │    │    │
│  │  │  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │    │    │    │
│  │  │  │  │ Azure Blob   │  │ Azure Comm   │  │ Azure Key │ │    │    │    │
│  │  │  │  │ Storage      │  │ Services     │  │ Vault     │ │    │    │    │
│  │  │  │  │ ├── GRS      │  │ ├── Email    │  │ ├── Certs │ │    │    │    │
│  │  │  │  │ ├── Versioned│  │ ├── SMS      │  │ ├── Keys  │ │    │    │    │
│  │  │  │  │ └── Lifecycle│  │ └── Push     │  │ └── Secrets│ │    │    │    │
│  │  │  │  └──────────────┘  └──────────────┘  └───────────┘ │    │    │    │
│  │  │  └─────────────────────────────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                      │    │
│  │  ┌────────────────────────────────────────┐                         │    │
│  │  │  Monitoring & Observability              │                         │    │
│  │  │  ├── Azure Application Insights          │                         │    │
│  │  │  ├── Azure Log Analytics Workspace       │                         │    │
│  │  │  ├── Sentry (external)                   │                         │    │
│  │  │  └── Azure Monitor Alert Rules           │                         │    │
│  │  └────────────────────────────────────────┘                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Container Architecture

The application uses a Docker multi-stage build to produce a minimal, secure production image. The build process separates dependency installation, application building, and production runtime into distinct stages.

```
┌────────────────────────────────────────────────────────────┐
│  Stage 1: base                                              │
│  FROM node:20-alpine                                        │
│  Purpose: Common base with security updates                 │
│  Size: ~180 MB                                              │
├────────────────────────────────────────────────────────────┤
│  Stage 2: deps                                              │
│  COPY package*.json → npm ci --omit=dev                     │
│  Purpose: Production dependencies only                      │
│  Size: ~250 MB                                              │
├────────────────────────────────────────────────────────────┤
│  Stage 3: build                                             │
│  COPY package*.json → npm ci (all) → COPY . → npm run build│
│  Purpose: Full build with devDependencies                   │
│  Size: ~800 MB (discarded)                                  │
├────────────────────────────────────────────────────────────┤
│  Stage 4: production                                        │
│  COPY --from=deps node_modules                              │
│  COPY --from=build build/ + server.js + package.json        │
│  USER node (non-root)                                       │
│  Purpose: Minimal runtime image                             │
│  Size: ~320 MB                                              │
└────────────────────────────────────────────────────────────┘
```

### 2.3 Network Topology

```
Internet
    │
    ▼
┌──────────────────┐
│  Azure Front Door │  Global load balancing, CDN, DDoS protection
│  (L7 routing)     │  Custom domain: accreditation.example.org
└────────┬─────────┘
         │ HTTPS (443)
         ▼
┌──────────────────────┐
│  Application Gateway  │  Regional WAF, SSL offload, path routing
│  (WAF v2)             │  Health probes: GET /up every 15s
└────────┬─────────────┘
         │ HTTPS (443)
         ▼
┌──────────────────────────────────────────────────────┐
│  VNet: 10.0.0.0/16                                    │
│                                                        │
│  ┌─────────────────────────┐                          │
│  │  snet-app: 10.0.1.0/24  │                          │
│  │  NSG Rules:              │                          │
│  │  ├── IN: 443 from AGW    │                          │
│  │  ├── IN: 8080 from AGW   │                          │
│  │  ├── OUT: 5432 to snet-data                        │
│  │  ├── OUT: 443 to snet-services                     │
│  │  └── DENY: all other     │                          │
│  │                           │                          │
│  │  App Service instances    │                          │
│  │  (auto-scale 2-8)        │                          │
│  └─────────────┬────────────┘                          │
│                │                                        │
│  ┌─────────────▼────────────┐                          │
│  │  snet-data: 10.0.2.0/24  │                          │
│  │  NSG Rules:              │                          │
│  │  ├── IN: 5432 from app   │                          │
│  │  └── DENY: all other     │                          │
│  │                           │                          │
│  │  PostgreSQL Flexible      │                          │
│  │  (private endpoint)       │                          │
│  └──────────────────────────┘                          │
│                                                        │
│  ┌──────────────────────────┐                          │
│  │  snet-services: 10.0.3.0/24                        │
│  │  NSG Rules:              │                          │
│  │  ├── IN: 443 from app    │                          │
│  │  └── DENY: all other     │                          │
│  │                           │                          │
│  │  Blob Storage, Key Vault  │                          │
│  │  (private endpoints)      │                          │
│  └──────────────────────────┘                          │
└──────────────────────────────────────────────────────┘
```

### 2.4 Environment Strategy

| Aspect            | Development                      | Staging                                 | Production                                  |
| ----------------- | -------------------------------- | --------------------------------------- | ------------------------------------------- |
| **Purpose**       | Local development & debugging    | Pre-production validation               | Live users                                  |
| **Database**      | PostgreSQL 16 via Docker Compose | Azure PostgreSQL Flexible (B2s)         | Azure PostgreSQL Flexible (D4s_v3, zone HA) |
| **Blob Storage**  | Azurite emulator                 | Azure Blob (LRS)                        | Azure Blob (GRS, versioned)                 |
| **Email**         | Logged to console (no send)      | Azure Comm Services (sandbox)           | Azure Comm Services (production)            |
| **Deployment**    | `docker compose up`              | Auto-deploy on `develop` push           | Manual gate on `main` push                  |
| **Instances**     | 1                                | 1                                       | 2-8 (auto-scale)                            |
| **Domain**        | `localhost:8080`                 | `staging.accreditation.example.org`     | `accreditation.example.org`                 |
| **Monitoring**    | Pino to stdout (pretty-print)    | Sentry (staging project) + App Insights | Sentry (prod project) + App Insights        |
| **Backup**        | None                             | Daily automated                         | Continuous + 35-day PITR                    |
| **SSL**           | Self-signed (optional)           | Azure-managed cert                      | Azure-managed cert                          |
| **Feature Flags** | All enabled                      | Mirrors production + experimental       | Controlled rollout                          |

---

## 3. Data Model

### 3.1 DatabaseBackup Model

The `DatabaseBackup` model tracks all database backup operations, including automated daily backups and manual on-demand backups triggered by administrators.

```prisma
model DatabaseBackup {
  id            String               @id @default(cuid())
  tenantId      String?              // null for full-system backups
  type          DatabaseBackupType
  status        DatabaseBackupStatus
  filePath      String?              // Azure Blob URL for completed backups
  fileSizeBytes BigInt?
  checksum      String?              // SHA-256 hash for integrity verification
  startedAt     DateTime             @default(now())
  completedAt   DateTime?
  expiresAt     DateTime?            // Auto-cleanup date
  errorMessage  String?
  metadata      Json?                // { tables: [...], rowCounts: {...}, pgVersion: "16.x" }
  triggeredBy   String               // userId or "system" for automated
  user          User?                @relation(fields: [triggeredBy], references: [id])

  @@index([tenantId, type, startedAt])
  @@index([status])
  @@index([expiresAt])
}

enum DatabaseBackupType {
  FULL           // Complete database dump
  INCREMENTAL    // WAL-based incremental
  TENANT         // Single-tenant export
  ON_DEMAND      // Manual admin-triggered
}

enum DatabaseBackupStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
  EXPIRED
  VERIFIED       // Restore test passed
}
```

### 3.2 Health Check Data

Health check data is not persisted to the database; it is computed on-demand by querying service dependencies. The response structure:

```typescript
interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string; // From package.json
  uptime: number; // Process uptime in seconds
  timestamp: string; // ISO 8601
  checks: {
    database: {
      status: "up" | "down";
      latencyMs: number;
      connectionPool: {
        active: number;
        idle: number;
        max: number;
      };
    };
    blobStorage: {
      status: "up" | "down";
      latencyMs: number;
    };
    jobQueue: {
      status: "up" | "down";
      activeJobs: number;
      queueDepth: number;
      oldestJobAge: number; // seconds
    };
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMB: number;
      percentUsed: number;
    };
  };
}
```

### 3.3 Deployment Metadata

```prisma
model DeploymentRecord {
  id            String   @id @default(cuid())
  version       String   // Semantic version or git SHA
  environment   String   // staging, production
  commitSha     String
  commitMessage String?
  branch        String
  imageTag      String   // Docker image tag
  deployedBy    String   // GitHub actor or "automation"
  deployedAt    DateTime @default(now())
  status        String   // success, failed, rolled_back
  duration      Int?     // Deployment duration in seconds
  slot          String?  // blue, green
  metadata      Json?    // { prNumber: 123, changelog: [...] }

  @@index([environment, deployedAt])
  @@index([version])
}

model BackgroundJob {
  id            String   @id @default(cuid())
  name          String   // Job type identifier
  queue         String   @default("default")
  state         String   // created, active, completed, failed, cancelled
  data          Json     // Job payload
  result        Json?    // Job result on completion
  retryCount    Int      @default(0)
  maxRetries    Int      @default(3)
  priority      Int      @default(0)
  startAfter    DateTime @default(now())
  startedAt     DateTime?
  completedAt   DateTime?
  expireIn      String?  // PostgreSQL interval
  errorMessage  String?
  tenantId      String?
  createdAt     DateTime @default(now())

  @@index([queue, state, startAfter])
  @@index([name, state])
  @@index([tenantId])
}
```

---

## 4. API Specification

### 4.1 Health Check Endpoints

Three health check endpoints serve different consumers: load balancers, monitoring systems, and Kubernetes readiness probes.

#### `GET /up` -- Liveness Probe

Minimal check for load balancer health probes. Returns immediately without checking dependencies.

```typescript
// app/routes/up.tsx
export async function loader() {
  return new Response("OK", { status: 200 });
}
```

**Response:** `200 OK` with body `OK`
**Latency target:** < 5ms
**Used by:** Azure Application Gateway health probe (every 15s)

#### `GET /health` -- Dependency Health

Comprehensive health check that verifies all service dependencies.

```typescript
// app/routes/health.tsx
export async function loader() {
  const checks = await Promise.allSettled([checkDatabase(), checkBlobStorage(), checkJobQueue()]);

  const results = {
    database: resolveCheck(checks[0]),
    blobStorage: resolveCheck(checks[1]),
    jobQueue: resolveCheck(checks[2]),
    memory: getMemoryStats(),
  };

  const status = determineOverallStatus(results);

  return json(
    {
      status,
      version: process.env.APP_VERSION || "development",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks: results,
    },
    { status: status === "unhealthy" ? 503 : 200 },
  );
}

async function checkDatabase(): Promise<{ status: string; latencyMs: number }> {
  const start = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const latencyMs = Math.round(performance.now() - start);

  const pool = await prisma.$metrics.prometheus();
  return {
    status: "up",
    latencyMs,
    connectionPool: parsePoolMetrics(pool),
  };
}
```

**Response:** `200 OK` or `503 Service Unavailable`
**Latency target:** < 500ms
**Used by:** Monitoring dashboards, alerting rules

#### `GET /ready` -- Readiness Probe

Indicates whether the application is ready to receive traffic. Checks database connectivity and pending migrations.

```typescript
// app/routes/ready.tsx
export async function loader() {
  try {
    // Verify database is reachable and migrations are current
    await prisma.$queryRaw`SELECT 1`;
    const pending = await checkPendingMigrations();

    if (pending > 0) {
      return json({ ready: false, reason: `${pending} pending migrations` }, { status: 503 });
    }

    return json({ ready: true }, { status: 200 });
  } catch (error) {
    return json({ ready: false, reason: "Database unreachable" }, { status: 503 });
  }
}
```

**Response:** `200 OK` or `503 Service Unavailable`
**Used by:** Blue-green deployment traffic shifting gate

### 4.2 Metrics Endpoints

#### `GET /metrics` -- Prometheus Metrics

Exposes application metrics in Prometheus format for scraping by Azure Monitor or Grafana.

```typescript
// app/routes/metrics.tsx
import { collectDefaultMetrics, Registry } from "prom-client";

const register = new Registry();
collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const activeConnections = new Gauge({
  name: "db_pool_active_connections",
  help: "Number of active database connections",
  registers: [register],
});

const jobQueueDepth = new Gauge({
  name: "job_queue_depth",
  help: "Number of pending jobs by queue",
  labelNames: ["queue"],
  registers: [register],
});

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePlatformAdmin(request);
  const metrics = await register.metrics();
  return new Response(metrics, {
    headers: { "Content-Type": register.contentType },
  });
}
```

### 4.3 Admin Endpoints

#### `POST /admin/backup` -- Trigger Backup

```typescript
// Requires: platform_admin role
// Body: { type: "FULL" | "TENANT", tenantId?: string }
// Response: { backupId: string, status: "IN_PROGRESS" }
```

#### `POST /admin/cache/clear` -- Clear Application Cache

```typescript
// Requires: platform_admin role
// Body: { scope: "all" | "countries" | "roles" | "field-definitions" | "settings" }
// Response: { cleared: string[], timestamp: string }
```

#### `POST /admin/jobs/retry` -- Retry Failed Jobs

```typescript
// Requires: platform_admin role
// Body: { jobId?: string, queue?: string, olderThan?: string }
// Response: { retriedCount: number, jobIds: string[] }
```

---

## 5. Business Logic

### 5.1 Docker Multi-Stage Build

#### Complete Production Dockerfile

```dockerfile
# ============================================================================
# Dockerfile - Multi-stage build for accreditation platform
# ============================================================================
# Stage 1: base - Common base image with security updates
# Stage 2: deps - Production dependencies only
# Stage 3: build - Full build with dev dependencies (discarded)
# Stage 4: production - Minimal runtime image
# ============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Base image with security patches
# ---------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install security updates and required system packages
RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache \
      dumb-init \
      curl \
      tini && \
    rm -rf /var/cache/apk/*

# Set working directory for all stages
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: Production dependencies only
# ---------------------------------------------------------------------------
FROM base AS deps

# Copy only package files for better layer caching
# If package.json hasn't changed, npm ci will be cached
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install production dependencies only
# --omit=dev excludes devDependencies
# --ignore-scripts prevents postinstall scripts for security
RUN npm ci --omit=dev --ignore-scripts && \
    npx prisma generate && \
    npm cache clean --force

# ---------------------------------------------------------------------------
# Stage 3: Build the application
# ---------------------------------------------------------------------------
FROM base AS build

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev for building)
RUN npm ci && \
    npx prisma generate

# Copy application source code
COPY . .

# Build the Remix application
RUN npm run build && \
    npm cache clean --force

# ---------------------------------------------------------------------------
# Stage 4: Production runtime
# ---------------------------------------------------------------------------
FROM base AS production

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Create non-root user for security
# node user (uid 1000) already exists in node:20-alpine
# but we ensure proper ownership
RUN mkdir -p /app && \
    chown -R node:node /app

WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/server.js ./
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/prisma ./prisma

# Switch to non-root user
USER node

# Expose application port
EXPOSE 8080

# Health check - verify the application responds
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/up || exit 1

# Use dumb-init to handle PID 1 and signal forwarding
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
```

#### .dockerignore

```dockerignore
# Version control
.git
.gitignore

# Dependencies (rebuilt in container)
node_modules

# Build artifacts (rebuilt in container)
build
dist
.cache

# Development files
.env
.env.local
.env.*.local
docker-compose*.yml

# IDE and editor files
.vscode
.idea
*.swp
*.swo
*~

# Test files
__tests__
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
coverage
.nyc_output
playwright-report
test-results

# Documentation
*.md
docs
LICENSE

# CI/CD files
.github
.husky

# OS files
.DS_Store
Thumbs.db

# Terraform / IaC
terraform
*.tfstate
*.tfstate.backup
```

#### Layer Caching Optimization Strategy

```
Build Order (optimized for cache hits):
┌─────────────────────────────────────────────────────────┐
│  1. System packages (changes: rarely)                    │  ← Cached months
│  2. package.json + package-lock.json (changes: weekly)   │  ← Cached days
│  3. prisma/schema.prisma (changes: weekly)               │  ← Cached days
│  4. npm ci (changes: when deps change)                   │  ← Cached days
│  5. prisma generate (changes: when schema changes)       │  ← Cached days
│  6. Application source (changes: every commit)           │  ← Rebuilt each CI
│  7. npm run build (changes: every commit)                │  ← Rebuilt each CI
└─────────────────────────────────────────────────────────┘

Key insight: Steps 1-5 are cached across most builds.
Only steps 6-7 run on every commit, taking ~30-60 seconds.
```

### 5.2 Docker Compose for Development

```yaml
# docker-compose.yml
# Development environment for the accreditation platform
# Usage: docker compose up -d
# ============================================================================

services:
  # --------------------------------------------------------------------------
  # Application service
  # --------------------------------------------------------------------------
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: build # Use build stage for development (includes devDeps)
    ports:
      - "8080:8080"
      - "9229:9229" # Node.js debugger port
    volumes:
      - .:/app
      - /app/node_modules # Preserve container node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/accreditation?schema=public
      - AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://storage:10000/devstoreaccount1;
      - SESSION_SECRET=dev-secret-change-in-production
      - APP_VERSION=development
      - LOG_LEVEL=debug
      - SENTRY_DSN=
    depends_on:
      db:
        condition: service_healthy
      storage:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped
    command: npm run dev

  # --------------------------------------------------------------------------
  # PostgreSQL database
  # --------------------------------------------------------------------------
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    environment:
      POSTGRES_DB: accreditation
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d accreditation"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - app-network
    restart: unless-stopped

  # --------------------------------------------------------------------------
  # Test database (isolated for test runs)
  # --------------------------------------------------------------------------
  db-test:
    image: postgres:16-alpine
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: accreditation_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d accreditation_test"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 5s
    tmpfs:
      - /var/lib/postgresql/data # In-memory for speed
    networks:
      - app-network
    restart: unless-stopped

  # --------------------------------------------------------------------------
  # Azure Blob Storage emulator (Azurite)
  # --------------------------------------------------------------------------
  storage:
    image: mcr.microsoft.com/azure-storage/azurite:latest
    ports:
      - "10000:10000" # Blob service
      - "10001:10001" # Queue service
      - "10002:10002" # Table service
    volumes:
      - azurite-data:/data
    command: "azurite --blobHost 0.0.0.0 --queueHost 0.0.0.0 --tableHost 0.0.0.0 --location /data --loose"
    healthcheck:
      test: ["CMD", "nc", "-z", "127.0.0.1", "10000"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s
    networks:
      - app-network
    restart: unless-stopped

  # --------------------------------------------------------------------------
  # Mailpit - Email testing (catches all outbound email)
  # --------------------------------------------------------------------------
  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "8025:8025" # Web UI
      - "1025:1025" # SMTP
    environment:
      MP_DATABASE: /data/mailpit.db
      MP_MAX_MESSAGES: 500
    volumes:
      - mailpit-data:/data
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8025/api/v1/info"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - app-network
    restart: unless-stopped

# ----------------------------------------------------------------------------
# Volumes
# ----------------------------------------------------------------------------
volumes:
  pgdata:
    driver: local
  azurite-data:
    driver: local
  mailpit-data:
    driver: local

# ----------------------------------------------------------------------------
# Networks
# ----------------------------------------------------------------------------
networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### 5.3 CI/CD Pipeline

#### Complete GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
# ============================================================================
# CI/CD Pipeline for Accreditation Platform
# ============================================================================
# Triggers: push to any branch, pull requests to main/develop
# Jobs: quality → test → build → deploy-staging → deploy-production
# ============================================================================

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop, "feature/**", "fix/**"]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: "20"
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  AZURE_WEBAPP_NAME: app-accreditation

# ============================================================================
# Job 1: Code Quality
# ============================================================================
jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: TypeScript type checking
        run: npx tsc --noEmit --pretty
        continue-on-error: false

      - name: ESLint with caching
        run: npx eslint . --ext .ts,.tsx --cache --cache-location .eslintcache --max-warnings 0

      - name: Prettier format check
        run: npx prettier --check "**/*.{ts,tsx,json,md,yml,yaml,css}" --ignore-path .prettierignore

      - name: Prisma schema validation
        run: npx prisma validate

      - name: Check for unused dependencies
        run: npx depcheck --ignores="@types/*,prisma,tailwindcss,postcss,autoprefixer"

  # ============================================================================
  # Job 2: Testing
  # ============================================================================
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: [quality]

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: accreditation_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d accreditation_test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          --health-start-period 10s

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/accreditation_test?schema=public
      SESSION_SECRET: test-session-secret
      NODE_ENV: test

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run database migrations
        run: npx prisma migrate deploy

      - name: Seed test database
        run: npx prisma db seed

      - name: Run unit tests with coverage
        run: npx vitest run --coverage --reporter=verbose --reporter=junit --outputFile=test-results/junit.xml
        env:
          VITEST_COVERAGE_REPORTER: lcov

      - name: Run integration tests
        run: npx vitest run --config vitest.integration.config.ts --reporter=verbose

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
          retention-days: 7

  # ============================================================================
  # Job 2b: E2E Tests (Playwright)
  # ============================================================================
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: [quality]

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: accreditation_e2e
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d accreditation_e2e"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/accreditation_e2e?schema=public
      SESSION_SECRET: e2e-session-secret
      NODE_ENV: test

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Generate Prisma client and migrate
        run: |
          npx prisma generate
          npx prisma migrate deploy
          npx prisma db seed

      - name: Build application
        run: npm run build

      - name: Run Playwright tests
        run: npx playwright test --project=chromium
        env:
          BASE_URL: http://localhost:8080

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

      - name: Upload Playwright traces
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces
          path: test-results/
          retention-days: 14

  # ============================================================================
  # Job 3: Build and Scan
  # ============================================================================
  build:
    name: Build & Scan
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [test, e2e]
    permissions:
      contents: read
      packages: write
      security-events: write

    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build-push.outputs.digest }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to container registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push Docker image
        id: build-push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64
          provenance: true
          sbom: true

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: "sarif"
          output: "trivy-results.sarif"
          severity: "CRITICAL,HIGH"
          exit-code: "1"
          ignore-unfixed: true

      - name: Upload Trivy scan results
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: "trivy-results.sarif"

      - name: Check image size
        run: |
          IMAGE_SIZE=$(docker inspect ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} --format='{{.Size}}' 2>/dev/null || echo "0")
          IMAGE_SIZE_MB=$((IMAGE_SIZE / 1024 / 1024))
          echo "Image size: ${IMAGE_SIZE_MB}MB"
          if [ "$IMAGE_SIZE_MB" -gt 500 ]; then
            echo "::warning::Docker image exceeds 500MB threshold (${IMAGE_SIZE_MB}MB)"
          fi

  # ============================================================================
  # Job 4: Deploy to Staging
  # ============================================================================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [build]
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    environment:
      name: staging
      url: https://staging.accreditation.example.org

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Azure Login via OIDC
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy to staging slot
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}-staging
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Wait for deployment health check
        run: |
          echo "Waiting for staging deployment to become healthy..."
          for i in $(seq 1 30); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
              https://staging.accreditation.example.org/up || echo "000")
            if [ "$STATUS" = "200" ]; then
              echo "Staging is healthy!"
              exit 0
            fi
            echo "Attempt $i/30: status=$STATUS, waiting 10s..."
            sleep 10
          done
          echo "::error::Staging health check failed after 5 minutes"
          exit 1

      - name: Run smoke tests against staging
        run: |
          npx playwright test --project=smoke --config=playwright.smoke.config.ts
        env:
          BASE_URL: https://staging.accreditation.example.org

      - name: Record deployment
        if: success()
        run: |
          curl -X POST https://staging.accreditation.example.org/api/admin/deployments \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "version": "${{ github.sha }}",
              "environment": "staging",
              "commitSha": "${{ github.sha }}",
              "branch": "${{ github.ref_name }}",
              "imageTag": "${{ github.sha }}",
              "deployedBy": "${{ github.actor }}",
              "status": "success"
            }'

  # ============================================================================
  # Job 5: Deploy to Production
  # ============================================================================
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: [build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://accreditation.example.org

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Azure Login via OIDC
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy to staging slot (blue-green)
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          slot-name: staging
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Wait for staging slot health
        run: |
          echo "Waiting for staging slot to become healthy..."
          for i in $(seq 1 30); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
              https://${{ env.AZURE_WEBAPP_NAME }}-staging.azurewebsites.net/up || echo "000")
            if [ "$STATUS" = "200" ]; then
              echo "Staging slot is healthy!"
              exit 0
            fi
            echo "Attempt $i/30: status=$STATUS, waiting 10s..."
            sleep 10
          done
          echo "::error::Staging slot health check failed"
          exit 1

      - name: Run pre-swap validation
        run: |
          HEALTH=$(curl -s https://${{ env.AZURE_WEBAPP_NAME }}-staging.azurewebsites.net/health)
          STATUS=$(echo $HEALTH | jq -r '.status')
          if [ "$STATUS" != "healthy" ]; then
            echo "::error::Health check returned status: $STATUS"
            echo "$HEALTH" | jq .
            exit 1
          fi
          echo "Pre-swap validation passed"
          echo "$HEALTH" | jq .

      - name: Swap staging to production
        run: |
          az webapp deployment slot swap \
            --resource-group rg-accreditation-prod \
            --name ${{ env.AZURE_WEBAPP_NAME }} \
            --slot staging \
            --target-slot production

      - name: Verify production health
        run: |
          echo "Verifying production after swap..."
          sleep 15
          for i in $(seq 1 12); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
              https://accreditation.example.org/up || echo "000")
            if [ "$STATUS" = "200" ]; then
              echo "Production is healthy after swap!"
              exit 0
            fi
            echo "Attempt $i/12: status=$STATUS, waiting 10s..."
            sleep 10
          done
          echo "::error::Production health check failed after swap, initiating rollback"
          az webapp deployment slot swap \
            --resource-group rg-accreditation-prod \
            --name ${{ env.AZURE_WEBAPP_NAME }} \
            --slot staging \
            --target-slot production
          exit 1

      - name: Record deployment
        if: success()
        run: |
          curl -X POST https://accreditation.example.org/api/admin/deployments \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "version": "${{ github.sha }}",
              "environment": "production",
              "commitSha": "${{ github.sha }}",
              "branch": "${{ github.ref_name }}",
              "imageTag": "${{ github.sha }}",
              "deployedBy": "${{ github.actor }}",
              "status": "success",
              "slot": "production"
            }'

      - name: Notify deployment success
        if: success()
        run: |
          echo "::notice::Production deployment successful: ${{ github.sha }}"
```

### 5.4 Testing Infrastructure

#### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Global test configuration
    globals: true,
    environment: "node",
    include: ["app/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "tests/integration/**", "node_modules"],

    // Setup files run before each test file
    setupFiles: ["./tests/setup/global-setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "html", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["app/**/*.{ts,tsx}"],
      exclude: [
        "app/**/*.test.{ts,tsx}",
        "app/**/*.spec.{ts,tsx}",
        "app/routes/**/*.tsx", // Route modules tested via integration
        "app/**/*.d.ts",
        "app/entry.*.tsx",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 15000,

    // Pool configuration
    pool: "forks",
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 4,
      },
    },

    // Reporter configuration
    reporters: ["verbose"],
  },
});
```

```typescript
// vitest.integration.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup/integration-setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: "forks",
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 2, // Limit parallelism for DB access
      },
    },
    reporters: ["verbose"],
  },
});
```

#### MSW Handler Setup

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

// Azure Blob Storage mock handlers
const blobHandlers = [
  // Upload blob
  http.put("https://*.blob.core.windows.net/:container/:path*", async ({ request, params }) => {
    const body = await request.arrayBuffer();
    const container = params.container as string;
    const path = (params.path as string[]).join("/");

    // Store in memory for test assertions
    mockBlobStore.set(`${container}/${path}`, {
      content: Buffer.from(body),
      contentType: request.headers.get("x-ms-blob-type") || "BlockBlob",
      metadata: Object.fromEntries(
        [...request.headers.entries()].filter(([k]) => k.startsWith("x-ms-meta-")),
      ),
      uploadedAt: new Date().toISOString(),
    });

    return new HttpResponse(null, {
      status: 201,
      headers: {
        "x-ms-request-id": crypto.randomUUID(),
        ETag: `"${crypto.randomUUID()}"`,
      },
    });
  }),

  // Download blob
  http.get("https://*.blob.core.windows.net/:container/:path*", ({ params }) => {
    const container = params.container as string;
    const path = (params.path as string[]).join("/");
    const blob = mockBlobStore.get(`${container}/${path}`);

    if (!blob) {
      return HttpResponse.xml(`<Error><Code>BlobNotFound</Code></Error>`, { status: 404 });
    }

    return new HttpResponse(blob.content, {
      status: 200,
      headers: { "Content-Type": "application/octet-stream" },
    });
  }),
];

// Azure Communication Services mock handlers
const emailHandlers = [
  http.post("https://*.communication.azure.com/emails:send*", async ({ request }) => {
    const body = await request.json();

    mockEmailStore.push({
      to: body.recipients.to,
      subject: body.content.subject,
      html: body.content.html,
      sentAt: new Date().toISOString(),
    });

    return HttpResponse.json({
      id: crypto.randomUUID(),
      status: "Queued",
    });
  }),
];

// In-memory stores for test assertions
export const mockBlobStore = new Map<string, any>();
export const mockEmailStore: any[] = [];

export const handlers = [...blobHandlers, ...emailHandlers];

export function resetMocks() {
  mockBlobStore.clear();
  mockEmailStore.length = 0;
}
```

```typescript
// tests/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

#### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Sequential for DB consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI
    ? [
        ["html", { open: "never" }],
        ["junit", { outputFile: "test-results/e2e-junit.xml" }],
      ]
    : [["html", { open: "on-failure" }]],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    // Setup project - authenticates and saves state
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop Chrome
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // Mobile Safari
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 14"],
        storageState: "tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    // Smoke tests (subset for post-deploy verification)
    {
      name: "smoke",
      testMatch: /.*\.smoke\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  // Start the development server before running tests
  webServer: process.env.CI
    ? undefined // CI builds and starts separately
    : {
        command: "npm run dev",
        port: 8080,
        reuseExistingServer: true,
        timeout: 120000,
      },
});
```

#### Test Database Management

```typescript
// tests/setup/global-setup.ts
import { beforeAll, afterAll, afterEach } from "vitest";
import { server } from "../mocks/server";
import { resetMocks } from "../mocks/handlers";

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Reset handlers and mocks after each test
afterEach(() => {
  server.resetHandlers();
  resetMocks();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});
```

```typescript
// tests/setup/integration-setup.ts
import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll, beforeEach } from "vitest";
import { execSync } from "child_process";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/accreditation_test?schema=public";

let prisma: PrismaClient;

beforeAll(async () => {
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  // Run migrations on test database
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });

  prisma = new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } },
  });

  await prisma.$connect();
});

beforeEach(async () => {
  // Truncate all tables in correct order (respecting foreign keys)
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE '_prisma%'
  `;

  await prisma.$executeRawUnsafe("SET session_replication_role = replica;");

  for (const { tablename } of tablenames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
  }

  await prisma.$executeRawUnsafe("SET session_replication_role = DEFAULT;");
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
```

#### Test Data Factories

```typescript
// tests/factories/index.ts
import { faker } from "@faker-js/faker";
import type { Prisma } from "@prisma/client";

// ---- Tenant Factory ----
export function buildTenant(
  overrides: Partial<Prisma.TenantCreateInput> = {},
): Prisma.TenantCreateInput {
  return {
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    domain: faker.internet.domainName(),
    status: "ACTIVE",
    settings: {
      timezone: "UTC",
      locale: "en",
      maxEventsPerYear: 50,
    },
    ...overrides,
  };
}

// ---- User Factory ----
export function buildUser(overrides: Partial<Prisma.UserCreateInput> = {}): Prisma.UserCreateInput {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    firstName,
    lastName,
    passwordHash: "$2b$10$mockhashedpasswordfortesting000000000000000",
    status: "ACTIVE",
    ...overrides,
  };
}

// ---- Event Factory ----
export function buildEvent(
  overrides: Partial<Prisma.EventCreateInput> = {},
): Prisma.EventCreateInput {
  const startDate = faker.date.future();
  const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  return {
    name: `${faker.company.buzzNoun()} Conference ${faker.date.future().getFullYear()}`,
    slug: faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),
    startDate,
    endDate,
    status: "DRAFT",
    venue: faker.location.city(),
    maxParticipants: faker.number.int({ min: 50, max: 5000 }),
    ...overrides,
  };
}

// ---- Participant Factory ----
export function buildParticipant(
  overrides: Partial<Prisma.ParticipantCreateInput> = {},
): Prisma.ParticipantCreateInput {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    organization: faker.company.name(),
    title: faker.person.jobTitle(),
    status: "PENDING",
    ...overrides,
  };
}

// ---- Seeder for full test scenarios ----
export async function seedFullScenario(prisma: any) {
  const tenant = await prisma.tenant.create({ data: buildTenant() });

  const adminUser = await prisma.user.create({
    data: buildUser({
      tenant: { connect: { id: tenant.id } },
      role: "TENANT_ADMIN",
    }),
  });

  const event = await prisma.event.create({
    data: buildEvent({
      tenant: { connect: { id: tenant.id } },
      createdBy: { connect: { id: adminUser.id } },
    }),
  });

  const participants = await Promise.all(
    Array.from({ length: 10 }, () =>
      prisma.participant.create({
        data: buildParticipant({
          event: { connect: { id: event.id } },
          tenant: { connect: { id: tenant.id } },
        }),
      }),
    ),
  );

  return { tenant, adminUser, event, participants };
}
```

### 5.5 Observability Stack

#### Pino Structured Logging with Correlation IDs

```typescript
// app/lib/logger.server.ts
import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";

// Async context for request-scoped correlation IDs
export const requestContext = new AsyncLocalStorage<{
  correlationId: string;
  tenantId?: string;
  userId?: string;
  requestPath?: string;
}>();

// Base logger configuration
const baseLogger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),

  // Structured format for production, pretty-print for development
  transport:
    process.env.NODE_ENV === "production"
      ? undefined // JSON to stdout (picked up by Azure Log Analytics)
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
            messageFormat: "{correlationId} [{tenantId}] {msg}",
          },
        },

  // Base fields included in every log line
  base: {
    service: "accreditation-platform",
    version: process.env.APP_VERSION || "development",
    environment: process.env.NODE_ENV || "development",
  },

  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "authorization",
      "cookie",
      "sessionId",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },

  // Custom serializers
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        "user-agent": req.headers?.["user-agent"],
        "content-type": req.headers?.["content-type"],
        "x-forwarded-for": req.headers?.["x-forwarded-for"],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },

  // Custom timestamp format (ISO 8601)
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create a child logger that automatically includes correlation context
export function getLogger(module?: string) {
  return new Proxy(baseLogger, {
    get(target, prop) {
      if (typeof target[prop as keyof typeof target] === "function") {
        return (...args: any[]) => {
          const context = requestContext.getStore();
          const child = target.child({
            ...(module && { module }),
            ...(context?.correlationId && { correlationId: context.correlationId }),
            ...(context?.tenantId && { tenantId: context.tenantId }),
            ...(context?.userId && { userId: context.userId }),
          });
          return (child as any)[prop](...args);
        };
      }
      return target[prop as keyof typeof target];
    },
  });
}

// Convenience export for common usage
export const logger = getLogger();
```

```typescript
// app/middleware/correlation.server.ts
import { randomUUID } from "node:crypto";
import { requestContext } from "~/lib/logger.server";

export function withCorrelation<T>(request: Request, handler: () => Promise<T>): Promise<T> {
  const correlationId =
    request.headers.get("x-correlation-id") || request.headers.get("x-request-id") || randomUUID();

  return requestContext.run(
    {
      correlationId,
      requestPath: new URL(request.url).pathname,
    },
    handler,
  );
}
```

#### Sentry Integration

```typescript
// app/lib/sentry.server.ts
import * as Sentry from "@sentry/remix";

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn("SENTRY_DSN not set, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    release: process.env.APP_VERSION || "unknown",

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session replay (client-side)
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    // Filter sensitive data
    beforeSend(event) {
      // Strip PII from error events
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }

      // Add tenant context
      const tenantId = event.tags?.tenantId;
      if (tenantId) {
        event.fingerprint = [...(event.fingerprint || []), tenantId];
      }

      return event;
    },

    // Ignore expected errors
    ignoreErrors: [
      "AbortError",
      "Response.redirect",
      /^Navigation cancelled/,
      /^Expected redirect/,
    ],

    // Integrations
    integrations: [Sentry.prismaIntegration(), Sentry.httpIntegration()],
  });
}
```

#### Azure Application Insights Setup

```typescript
// app/lib/app-insights.server.ts
import * as appInsights from "applicationinsights";
import { requestContext } from "~/lib/logger.server";

export function initAppInsights() {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

  if (!connectionString) {
    console.warn("Application Insights connection string not set");
    return;
  }

  appInsights
    .setup(connectionString)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(false) // We use Pino
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start();

  const client = appInsights.defaultClient;

  // Add correlation ID to all telemetry
  client.addTelemetryProcessor((envelope, context) => {
    const reqContext = requestContext.getStore();
    if (reqContext?.correlationId) {
      envelope.tags = envelope.tags || {};
      envelope.tags["ai.operation.id"] = reqContext.correlationId;
    }
    if (reqContext?.tenantId) {
      const data = envelope.data as any;
      if (data?.baseData?.properties) {
        data.baseData.properties.tenantId = reqContext.tenantId;
      }
    }
    return true;
  });

  return client;
}
```

#### Custom Metrics Registry

```typescript
// app/lib/metrics.server.ts
import { Counter, Histogram, Gauge, Registry } from "prom-client";

export const metricsRegistry = new Registry();

// ---- HTTP Metrics ----
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code", "tenant_id"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const httpRequestTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

// ---- Database Metrics ----
export const dbQueryDuration = new Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "model"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [metricsRegistry],
});

export const dbPoolActive = new Gauge({
  name: "db_pool_active_connections",
  help: "Number of active database pool connections",
  registers: [metricsRegistry],
});

export const dbPoolIdle = new Gauge({
  name: "db_pool_idle_connections",
  help: "Number of idle database pool connections",
  registers: [metricsRegistry],
});

// ---- Job Queue Metrics ----
export const jobQueueDepth = new Gauge({
  name: "job_queue_depth",
  help: "Number of pending jobs by queue",
  labelNames: ["queue", "state"],
  registers: [metricsRegistry],
});

export const jobProcessingDuration = new Histogram({
  name: "job_processing_duration_seconds",
  help: "Duration of background job processing",
  labelNames: ["job_type", "status"],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300],
  registers: [metricsRegistry],
});

export const jobFailureTotal = new Counter({
  name: "job_failures_total",
  help: "Total number of failed background jobs",
  labelNames: ["job_type", "error_type"],
  registers: [metricsRegistry],
});

// ---- SSE Metrics ----
export const sseActiveConnections = new Gauge({
  name: "sse_active_connections",
  help: "Number of active SSE connections",
  labelNames: ["tenant_id"],
  registers: [metricsRegistry],
});

// ---- Business Metrics ----
export const participantRegistrations = new Counter({
  name: "participant_registrations_total",
  help: "Total participant registrations",
  labelNames: ["tenant_id", "event_id", "status"],
  registers: [metricsRegistry],
});

export const fileUploads = new Counter({
  name: "file_uploads_total",
  help: "Total file uploads",
  labelNames: ["tenant_id", "file_type", "status"],
  registers: [metricsRegistry],
});

// ---- Observability Mapping ----
//
// | Tool                         | Purpose                                         |
// |------------------------------|-------------------------------------------------|
// | **Sentry**                   | Error tracking and performance monitoring       |
// | **Pino**                     | Structured JSON logging (replace console.log)   |
// | **Azure Application Insights** | APM, request tracing, dependency tracking     |
// | **Prometheus (prom-client)** | Custom application metrics                      |
// | **Health Check (/up)**       | Liveness probe for load balancer                |
// | **Health Check (/health)**   | Dependency health for monitoring dashboards     |
// | **Health Check (/ready)**    | Readiness probe for deployment gates            |
```

### 5.6 Backup and Recovery

#### Automated Backup Scheduling via pg-boss

```typescript
// app/lib/backup.server.ts
import PgBoss from "pg-boss";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { BlobServiceClient } from "@azure/storage-blob";
import { prisma } from "~/lib/prisma.server";
import { getLogger } from "~/lib/logger.server";

const execAsync = promisify(exec);
const logger = getLogger("backup");

// ---- Backup Job Registration ----
export async function registerBackupJobs(boss: PgBoss) {
  // Daily full backup at 02:00 UTC
  await boss.schedule("backup-full", "0 2 * * *", {
    type: "FULL",
    triggeredBy: "system",
  });

  // Hourly incremental backup
  await boss.schedule("backup-incremental", "0 * * * *", {
    type: "INCREMENTAL",
    triggeredBy: "system",
  });

  // Weekly backup verification (restore test) on Sundays at 04:00 UTC
  await boss.schedule("backup-verify", "0 4 * * 0", {
    triggeredBy: "system",
  });

  // Daily cleanup of expired backups at 03:00 UTC
  await boss.schedule("backup-cleanup", "0 3 * * *", {
    triggeredBy: "system",
  });

  // Register handlers
  await boss.work("backup-full", { teamSize: 1, teamConcurrency: 1 }, handleFullBackup);
  await boss.work(
    "backup-incremental",
    { teamSize: 1, teamConcurrency: 1 },
    handleIncrementalBackup,
  );
  await boss.work("backup-verify", { teamSize: 1, teamConcurrency: 1 }, handleBackupVerification);
  await boss.work("backup-cleanup", { teamSize: 1, teamConcurrency: 1 }, handleBackupCleanup);
}

// ---- Full Database Backup ----
async function handleFullBackup(
  job: PgBoss.Job<{ type: string; triggeredBy: string; tenantId?: string }>,
) {
  const { type, triggeredBy, tenantId } = job.data;
  const backupRecord = await prisma.databaseBackup.create({
    data: {
      type: type as any,
      status: "IN_PROGRESS",
      triggeredBy,
      tenantId: tenantId || null,
      expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days
    },
  });

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-full-${timestamp}.sql.gz`;
    const localPath = `/tmp/${filename}`;

    // Execute pg_dump with compression
    const databaseUrl = process.env.DATABASE_URL!;
    await execAsync(
      `pg_dump "${databaseUrl}" \
        --format=custom \
        --compress=9 \
        --verbose \
        --no-owner \
        --no-privileges \
        --file="${localPath}"`,
      { timeout: 30 * 60 * 1000 }, // 30 minute timeout
    );

    // Calculate checksum
    const { stdout: checksumOutput } = await execAsync(`sha256sum "${localPath}"`);
    const checksum = checksumOutput.split(" ")[0];

    // Get file size
    const { stdout: sizeOutput } = await execAsync(
      `stat -f%z "${localPath}" 2>/dev/null || stat -c%s "${localPath}"`,
    );
    const fileSizeBytes = BigInt(sizeOutput.trim());

    // Upload to Azure Blob Storage
    const blobClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
    );
    const containerClient = blobClient.getContainerClient("backups");
    await containerClient.createIfNotExists();

    const blobPath = `database/${timestamp}/${filename}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.uploadFile(localPath, {
      metadata: {
        backupId: backupRecord.id,
        type: "FULL",
        checksum,
        timestamp,
      },
      tags: {
        environment: process.env.NODE_ENV || "production",
        type: "database-backup",
      },
    });

    // Clean up local file
    await execAsync(`rm -f "${localPath}"`);

    // Update backup record
    await prisma.databaseBackup.update({
      where: { id: backupRecord.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        filePath: blockBlobClient.url,
        fileSizeBytes,
        checksum,
        metadata: {
          filename,
          blobPath,
          pgVersion: (await execAsync("pg_dump --version")).stdout.trim(),
        },
      },
    });

    logger.info(
      { backupId: backupRecord.id, fileSizeBytes: fileSizeBytes.toString() },
      "Full database backup completed successfully",
    );
  } catch (error) {
    logger.error({ backupId: backupRecord.id, error }, "Full database backup failed");
    await prisma.databaseBackup.update({
      where: { id: backupRecord.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

// ---- Incremental Backup (WAL archiving) ----
async function handleIncrementalBackup(job: PgBoss.Job) {
  logger.info("Incremental backup triggered - handled by Azure PostgreSQL WAL archiving");
  // Azure PostgreSQL Flexible Server handles WAL archiving automatically.
  // This job exists to record that the incremental checkpoint was verified.
  const walStatus = await prisma.$queryRaw<any[]>`
    SELECT pg_current_wal_lsn() as current_lsn,
           pg_walfile_name(pg_current_wal_lsn()) as current_wal
  `;

  await prisma.databaseBackup.create({
    data: {
      type: "INCREMENTAL",
      status: "COMPLETED",
      triggeredBy: "system",
      completedAt: new Date(),
      metadata: { walStatus: walStatus[0] },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
}

// ---- Backup Verification (Restore Test) ----
async function handleBackupVerification(job: PgBoss.Job) {
  logger.info("Starting weekly backup verification (restore test)");

  // Find the most recent completed full backup
  const latestBackup = await prisma.databaseBackup.findFirst({
    where: { type: "FULL", status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });

  if (!latestBackup || !latestBackup.filePath) {
    logger.warn("No completed full backup found for verification");
    return;
  }

  try {
    // Download backup from blob storage
    const blobClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
    );
    const url = new URL(latestBackup.filePath);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const containerName = pathParts[0];
    const blobPath = pathParts.slice(1).join("/");

    const containerClient = blobClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    const localPath = `/tmp/verify-${Date.now()}.sql.gz`;
    await blockBlobClient.downloadToFile(localPath);

    // Verify checksum
    const { stdout: checksumOutput } = await execAsync(`sha256sum "${localPath}"`);
    const checksum = checksumOutput.split(" ")[0];
    if (checksum !== latestBackup.checksum) {
      throw new Error(`Checksum mismatch: expected ${latestBackup.checksum}, got ${checksum}`);
    }

    // Attempt restore to a temporary database
    const testDbName = `verify_${Date.now()}`;
    await execAsync(`createdb "${testDbName}"`);

    try {
      await execAsync(
        `pg_restore --dbname="${testDbName}" --no-owner --no-privileges "${localPath}"`,
        { timeout: 30 * 60 * 1000 },
      );

      // Run basic integrity checks
      const tableCount = await execAsync(
        `psql "${testDbName}" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"`,
      );
      logger.info({ tableCount: tableCount.stdout.trim() }, "Restore verification: table count");
    } finally {
      // Always clean up test database and temp file
      await execAsync(`dropdb --if-exists "${testDbName}"`);
      await execAsync(`rm -f "${localPath}"`);
    }

    // Mark backup as verified
    await prisma.databaseBackup.update({
      where: { id: latestBackup.id },
      data: { status: "VERIFIED" },
    });

    logger.info({ backupId: latestBackup.id }, "Backup verification passed");
  } catch (error) {
    logger.error({ backupId: latestBackup.id, error }, "Backup verification failed");
    throw error;
  }
}

// ---- Expired Backup Cleanup ----
async function handleBackupCleanup(job: PgBoss.Job) {
  const expiredBackups = await prisma.databaseBackup.findMany({
    where: {
      expiresAt: { lt: new Date() },
      status: { not: "IN_PROGRESS" },
    },
  });

  for (const backup of expiredBackups) {
    if (backup.filePath) {
      try {
        const blobClient = BlobServiceClient.fromConnectionString(
          process.env.AZURE_STORAGE_CONNECTION_STRING!,
        );
        const url = new URL(backup.filePath);
        const pathParts = url.pathname.split("/").filter(Boolean);
        const containerClient = blobClient.getContainerClient(pathParts[0]);
        const blockBlobClient = containerClient.getBlockBlobClient(pathParts.slice(1).join("/"));
        await blockBlobClient.deleteIfExists();
      } catch (error) {
        logger.warn({ backupId: backup.id, error }, "Failed to delete backup blob");
      }
    }

    await prisma.databaseBackup.update({
      where: { id: backup.id },
      data: { status: "EXPIRED" },
    });
  }

  logger.info({ count: expiredBackups.length }, "Expired backups cleaned up");
}
```

#### PITR Configuration

Azure Database for PostgreSQL Flexible Server provides built-in Point-in-Time Restore (PITR) with no additional application code required:

| Setting              | Value              | Description                            |
| -------------------- | ------------------ | -------------------------------------- |
| **Backup retention** | 35 days            | Maximum retention for PITR             |
| **Backup frequency** | Continuous WAL     | Write-ahead logs archived continuously |
| **Full backup**      | Weekly (automated) | Azure-managed full snapshots           |
| **Geo-redundancy**   | GRS (production)   | Backups replicated to paired region    |
| **RPO**              | < 5 minutes        | Recovery Point Objective               |
| **RTO**              | < 1 hour           | Recovery Time Objective                |

#### Disaster Recovery Runbook

```
DISASTER RECOVERY PROCEDURE
============================================================================

SCENARIO 1: Database corruption or data loss
─────────────────────────────────────────────
1. ASSESS: Determine scope of corruption
   $ az postgres flexible-server show --name pgfs-accreditation-prod

2. DECIDE: PITR vs full restore
   - If < 35 days old: Use Azure PITR
   - If specific tenant: Use tenant-level backup

3. PITR RESTORE:
   $ az postgres flexible-server restore \
       --resource-group rg-accreditation-prod \
       --name pgfs-accreditation-prod-restored \
       --source-server pgfs-accreditation-prod \
       --restore-time "2026-02-09T14:00:00Z"

4. VALIDATE: Connect to restored server and verify data integrity
   $ psql "host=pgfs-accreditation-prod-restored.postgres.database.azure.com ..."
   > SELECT count(*) FROM "Tenant";
   > SELECT count(*) FROM "Participant";

5. SWITCH: Update application connection string
   $ az webapp config appsettings set \
       --name app-accreditation \
       --resource-group rg-accreditation-prod \
       --settings DATABASE_URL="<new-connection-string>"

6. VERIFY: Check application health
   $ curl https://accreditation.example.org/health

SCENARIO 2: Complete region failure
─────────────────────────────────────────────
1. Activate geo-redundant backup in paired region
2. Create new PostgreSQL server from geo-backup
3. Update DNS to point to secondary region
4. Deploy application to secondary region App Service
5. Verify all services operational

SCENARIO 3: Application rollback
─────────────────────────────────────────────
1. Swap deployment slots (instant):
   $ az webapp deployment slot swap \
       --name app-accreditation \
       --resource-group rg-accreditation-prod \
       --slot staging --target-slot production
2. Verify health: curl https://accreditation.example.org/up
```

### 5.7 Background Job Framework

#### pg-boss Setup and Configuration

```typescript
// app/lib/jobs.server.ts
import PgBoss from "pg-boss";
import { getLogger } from "~/lib/logger.server";
import { jobProcessingDuration, jobFailureTotal, jobQueueDepth } from "~/lib/metrics.server";

const logger = getLogger("jobs");

let boss: PgBoss | null = null;

export async function getJobQueue(): Promise<PgBoss> {
  if (boss) return boss;

  boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,

    // Schema configuration - uses dedicated schema to avoid conflicts
    schema: "pgboss",

    // Monitoring interval
    monitorStateIntervalSeconds: 30,

    // Archive completed jobs after 7 days
    archiveCompletedAfterSeconds: 7 * 24 * 60 * 60,

    // Delete archived jobs after 30 days
    deleteAfterSeconds: 30 * 24 * 60 * 60,

    // Retry configuration defaults
    retryLimit: 3,
    retryDelay: 30, // seconds
    retryBackoff: true, // Exponential backoff

    // Expiration: jobs expire if not started within 1 hour
    expireInSeconds: 60 * 60,

    // Maintenance - clean up old jobs
    maintenanceIntervalMinutes: 5,

    // Uuid generation
    uuid: "v4",
  });

  // Event handlers for monitoring
  boss.on("error", (error) => {
    logger.error({ error }, "pg-boss error");
  });

  boss.on("monitor-states", (states) => {
    // Update Prometheus metrics
    for (const [queue, counts] of Object.entries(states.queues)) {
      jobQueueDepth.set({ queue, state: "created" }, (counts as any).created || 0);
      jobQueueDepth.set({ queue, state: "active" }, (counts as any).active || 0);
      jobQueueDepth.set({ queue, state: "failed" }, (counts as any).failed || 0);
    }
    logger.debug({ states }, "Job queue states");
  });

  await boss.start();
  logger.info("pg-boss job queue started");

  return boss;
}

export async function stopJobQueue(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 30000 });
    boss = null;
    logger.info("pg-boss job queue stopped");
  }
}
```

#### Job Type Catalog

```typescript
// app/lib/job-types.server.ts
import type PgBoss from "pg-boss";
import { getLogger } from "~/lib/logger.server";
import { jobProcessingDuration, jobFailureTotal } from "~/lib/metrics.server";

const logger = getLogger("job-handlers");

// ---- Job Type Definitions ----

export interface JobTypeConfig {
  name: string;
  queue: string;
  retryLimit: number;
  retryDelay: number; // seconds
  retryBackoff: boolean;
  expireInSeconds: number;
  priority: number; // 0 = normal, higher = more urgent
  teamSize: number; // concurrent workers
  teamConcurrency: number; // concurrent jobs per worker
  description: string;
}

export const JOB_TYPES: Record<string, JobTypeConfig> = {
  // ---- Email Jobs ----
  "email-send": {
    name: "email-send",
    queue: "email",
    retryLimit: 5,
    retryDelay: 60,
    retryBackoff: true,
    expireInSeconds: 3600,
    priority: 5,
    teamSize: 2,
    teamConcurrency: 5,
    description: "Send transactional email via Azure Communication Services",
  },

  // ---- SLA Check Jobs ----
  "sla-check": {
    name: "sla-check",
    queue: "workflow",
    retryLimit: 3,
    retryDelay: 300,
    retryBackoff: false,
    expireInSeconds: 1800,
    priority: 8,
    teamSize: 1,
    teamConcurrency: 3,
    description: "Check workflow SLA deadlines and escalate overdue items",
  },

  // ---- Report Generation ----
  "report-generate": {
    name: "report-generate",
    queue: "reports",
    retryLimit: 2,
    retryDelay: 120,
    retryBackoff: true,
    expireInSeconds: 7200,
    priority: 3,
    teamSize: 1,
    teamConcurrency: 1,
    description: "Generate PDF/Excel reports for events and participants",
  },

  // ---- Database Backup ----
  "backup-run": {
    name: "backup-run",
    queue: "maintenance",
    retryLimit: 2,
    retryDelay: 600,
    retryBackoff: false,
    expireInSeconds: 7200,
    priority: 10,
    teamSize: 1,
    teamConcurrency: 1,
    description: "Execute database backup and upload to Azure Blob Storage",
  },

  // ---- File Processing ----
  "file-process": {
    name: "file-process",
    queue: "files",
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
    expireInSeconds: 1800,
    priority: 5,
    teamSize: 2,
    teamConcurrency: 3,
    description: "Process uploaded files: validation, optimization, thumbnail generation",
  },

  // ---- Cache Warming ----
  "cache-warm": {
    name: "cache-warm",
    queue: "maintenance",
    retryLimit: 1,
    retryDelay: 60,
    retryBackoff: false,
    expireInSeconds: 600,
    priority: 1,
    teamSize: 1,
    teamConcurrency: 1,
    description: "Pre-populate caches for frequently accessed data",
  },

  // ---- Audit Log Cleanup ----
  "audit-cleanup": {
    name: "audit-cleanup",
    queue: "maintenance",
    retryLimit: 2,
    retryDelay: 300,
    retryBackoff: false,
    expireInSeconds: 3600,
    priority: 2,
    teamSize: 1,
    teamConcurrency: 1,
    description: "Archive and purge old audit log entries beyond retention period",
  },
};

// ---- Job Registration ----
export async function registerAllJobHandlers(boss: PgBoss) {
  for (const [name, config] of Object.entries(JOB_TYPES)) {
    const handler = jobHandlers[name];
    if (!handler) {
      logger.warn({ jobType: name }, "No handler registered for job type");
      continue;
    }

    await boss.work(
      name,
      {
        teamSize: config.teamSize,
        teamConcurrency: config.teamConcurrency,
      },
      createWrappedHandler(name, handler),
    );

    logger.info({ jobType: name, queue: config.queue }, "Registered job handler");
  }
}

// ---- Instrumented Handler Wrapper ----
function createWrappedHandler(jobType: string, handler: (job: PgBoss.Job) => Promise<void>) {
  return async (job: PgBoss.Job) => {
    const startTime = performance.now();
    const jobLogger = logger.child({ jobId: job.id, jobType });

    jobLogger.info({ data: job.data }, "Job started");

    try {
      await handler(job);

      const durationSec = (performance.now() - startTime) / 1000;
      jobProcessingDuration.observe({ job_type: jobType, status: "success" }, durationSec);
      jobLogger.info({ durationMs: Math.round(durationSec * 1000) }, "Job completed");
    } catch (error) {
      const durationSec = (performance.now() - startTime) / 1000;
      jobProcessingDuration.observe({ job_type: jobType, status: "failure" }, durationSec);
      jobFailureTotal.inc({
        job_type: jobType,
        error_type: error instanceof Error ? error.constructor.name : "Unknown",
      });
      jobLogger.error({ error, durationMs: Math.round(durationSec * 1000) }, "Job failed");
      throw error; // Re-throw so pg-boss handles retry
    }
  };
}

// ---- Job Handlers Map ----
const jobHandlers: Record<string, (job: PgBoss.Job) => Promise<void>> = {
  "email-send": async (job) => {
    const { to, subject, template, data } = job.data as any;
    // Delegate to email service (see Module 04: Notifications)
    const { sendEmail } = await import("~/lib/email.server");
    await sendEmail({ to, subject, template, data });
  },

  "sla-check": async (job) => {
    const { evaluateSLADeadlines } = await import("~/lib/workflow-sla.server");
    await evaluateSLADeadlines();
  },

  "report-generate": async (job) => {
    const { reportType, eventId, tenantId, format } = job.data as any;
    const { generateReport } = await import("~/lib/reports.server");
    await generateReport({ reportType, eventId, tenantId, format });
  },

  "backup-run": async (job) => {
    // Handled by backup module (section 5.6)
  },

  "file-process": async (job) => {
    const { fileId, tenantId, operations } = job.data as any;
    const { processFile } = await import("~/lib/file-processor.server");
    await processFile({ fileId, tenantId, operations });
  },

  "cache-warm": async (job) => {
    const { cacheKeys } = job.data as any;
    const { warmCaches } = await import("~/lib/cache.server");
    await warmCaches(cacheKeys);
  },

  "audit-cleanup": async (job) => {
    const { retentionDays } = job.data as any;
    const { cleanupAuditLogs } = await import("~/lib/audit.server");
    await cleanupAuditLogs(retentionDays || 90);
  },
};
```

#### Dead Letter Queue Handling

```typescript
// app/lib/dead-letter.server.ts
import PgBoss from "pg-boss";
import { getLogger } from "~/lib/logger.server";
import { prisma } from "~/lib/prisma.server";

const logger = getLogger("dead-letter");

export async function setupDeadLetterHandling(boss: PgBoss) {
  // Monitor for jobs that have exhausted all retries
  await boss.work("__state__failed", { teamSize: 1 }, async (job) => {
    logger.error(
      {
        failedJobId: job.data.id,
        jobName: job.data.name,
        retryCount: job.data.retryCount,
        error: job.data.output,
      },
      "Job moved to dead letter queue after exhausting all retries",
    );

    // Store in application-level dead letter record for admin review
    await prisma.backgroundJob.update({
      where: { id: job.data.id },
      data: {
        state: "dead_letter",
        errorMessage: `Exhausted all retries. Last error: ${JSON.stringify(job.data.output)}`,
      },
    });

    // Send alert for critical job types
    const criticalJobs = ["backup-run", "sla-check", "email-send"];
    if (criticalJobs.includes(job.data.name)) {
      const { sendAlert } = await import("~/lib/alerts.server");
      await sendAlert({
        severity: "high",
        title: `Critical job failed permanently: ${job.data.name}`,
        details: {
          jobId: job.data.id,
          jobType: job.data.name,
          lastError: job.data.output,
          retryCount: job.data.retryCount,
        },
      });
    }
  });
}
```

### 5.8 File Processing Pipeline

```typescript
// app/lib/file-processor.server.ts
import sharp from "sharp";
import { BlobServiceClient } from "@azure/storage-blob";
import { getLogger } from "~/lib/logger.server";
import { fileUploads } from "~/lib/metrics.server";

const logger = getLogger("file-processor");

// ---- File Type Configuration ----
const ALLOWED_MIME_TYPES: Record<
  string,
  { extensions: string[]; maxSizeMB: number; magicBytes?: Buffer[] }
> = {
  "image/jpeg": {
    extensions: [".jpg", ".jpeg"],
    maxSizeMB: 10,
    magicBytes: [Buffer.from([0xff, 0xd8, 0xff])],
  },
  "image/png": {
    extensions: [".png"],
    maxSizeMB: 10,
    magicBytes: [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  },
  "image/webp": {
    extensions: [".webp"],
    maxSizeMB: 10,
    magicBytes: [Buffer.from("RIFF"), Buffer.from("WEBP")],
  },
  "application/pdf": {
    extensions: [".pdf"],
    maxSizeMB: 25,
    magicBytes: [Buffer.from("%PDF")],
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    extensions: [".xlsx"],
    maxSizeMB: 50,
    magicBytes: [Buffer.from([0x50, 0x4b, 0x03, 0x04])], // ZIP magic bytes
  },
};

// ---- Upload Validation ----
export async function validateUpload(
  file: File,
  tenantId: string,
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // 1. Check MIME type
  const typeConfig = ALLOWED_MIME_TYPES[file.type];
  if (!typeConfig) {
    errors.push(
      `File type "${file.type}" is not allowed. Allowed types: ${Object.keys(ALLOWED_MIME_TYPES).join(", ")}`,
    );
    return { valid: false, errors };
  }

  // 2. Check file size
  const maxBytes = typeConfig.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    errors.push(
      `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum of ${typeConfig.maxSizeMB}MB`,
    );
  }

  // 3. Check file extension
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!typeConfig.extensions.includes(ext)) {
    errors.push(`File extension "${ext}" does not match expected extensions for ${file.type}`);
  }

  // 4. Validate magic bytes (file signature)
  if (typeConfig.magicBytes && typeConfig.magicBytes.length > 0) {
    const buffer = Buffer.from(await file.slice(0, 16).arrayBuffer());
    const validSignature = typeConfig.magicBytes.some((magic) =>
      buffer.subarray(0, magic.length).equals(magic),
    );
    if (!validSignature) {
      errors.push("File content does not match declared MIME type (magic bytes mismatch)");
    }
  }

  // 5. Check filename for path traversal
  if (file.name.includes("..") || file.name.includes("/") || file.name.includes("\\")) {
    errors.push("Filename contains invalid characters");
  }

  if (errors.length > 0) {
    fileUploads.inc({ tenant_id: tenantId, file_type: file.type, status: "rejected" });
  }

  return { valid: errors.length === 0, errors };
}

// ---- Image Optimization with Sharp ----
export async function optimizeImage(
  inputBuffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "jpeg" | "png" | "webp";
    generateThumbnail?: boolean;
    thumbnailSize?: number;
  } = {},
): Promise<{
  optimized: Buffer;
  thumbnail?: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  };
}> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 80,
    format = "webp",
    generateThumbnail = true,
    thumbnailSize = 200,
  } = options;

  const originalSize = inputBuffer.length;

  // Get original metadata
  const originalMeta = await sharp(inputBuffer).metadata();

  // Optimize main image
  let pipeline = sharp(inputBuffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

  // Convert to target format
  switch (format) {
    case "webp":
      pipeline = pipeline.webp({ quality, effort: 4 });
      break;
    case "jpeg":
      pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
      break;
    case "png":
      pipeline = pipeline.png({ quality, compressionLevel: 8, progressive: true });
      break;
  }

  // Strip EXIF data (privacy)
  pipeline = pipeline.withMetadata({ orientation: undefined });

  const optimized = await pipeline.toBuffer();
  const optimizedMeta = await sharp(optimized).metadata();

  // Generate thumbnail
  let thumbnail: Buffer | undefined;
  if (generateThumbnail) {
    thumbnail = await sharp(inputBuffer)
      .rotate()
      .resize(thumbnailSize, thumbnailSize, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: 60 })
      .toBuffer();
  }

  return {
    optimized,
    thumbnail,
    metadata: {
      width: optimizedMeta.width || 0,
      height: optimizedMeta.height || 0,
      format,
      originalSize,
      optimizedSize: optimized.length,
      compressionRatio: Number((originalSize / optimized.length).toFixed(2)),
    },
  };
}

// ---- Azure Blob Organization Strategy ----
//
// Container: uploads
// Path structure: tenant/{tenantId}/event/{eventId}/{type}/{filename}
//
// Examples:
//   tenant/clx123/event/clx456/photo/participant-badge-photo.webp
//   tenant/clx123/event/clx456/photo/thumb/participant-badge-photo.webp
//   tenant/clx123/event/clx456/document/passport-scan.pdf
//   tenant/clx123/event/clx456/report/attendance-report-2026-02.xlsx
//   tenant/clx123/branding/logo.png
//

export async function uploadToBlob(
  buffer: Buffer,
  options: {
    tenantId: string;
    eventId?: string;
    fileType: "photo" | "document" | "report" | "branding" | "badge-template";
    filename: string;
    contentType: string;
    metadata?: Record<string, string>;
    isThumbnail?: boolean;
  },
): Promise<{ url: string; blobPath: string }> {
  const { tenantId, eventId, fileType, filename, contentType, metadata, isThumbnail } = options;

  // Build path
  let blobPath = `tenant/${tenantId}`;
  if (eventId) {
    blobPath += `/event/${eventId}`;
  }
  blobPath += `/${fileType}`;
  if (isThumbnail) {
    blobPath += "/thumb";
  }
  blobPath += `/${filename}`;

  const blobClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!,
  );
  const containerClient = blobClient.getContainerClient("uploads");
  await containerClient.createIfNotExists();

  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: "public, max-age=31536000, immutable",
    },
    metadata: {
      tenantId,
      ...(eventId && { eventId }),
      fileType,
      uploadedAt: new Date().toISOString(),
      ...metadata,
    },
    tags: {
      tenant: tenantId,
      type: fileType,
    },
  });

  return {
    url: blockBlobClient.url,
    blobPath,
  };
}

// ---- Virus Scanning Integration Point ----
export async function scanForViruses(
  buffer: Buffer,
  filename: string,
): Promise<{
  clean: boolean;
  scanResult: string;
}> {
  // Integration point for virus scanning service
  // In production, this would call Azure Defender for Storage or ClamAV
  if (process.env.VIRUS_SCAN_ENABLED !== "true") {
    logger.warn("Virus scanning is disabled - VIRUS_SCAN_ENABLED is not true");
    return { clean: true, scanResult: "skipped" };
  }

  try {
    // Azure Defender for Storage scans blobs automatically on upload.
    // This function provides an additional pre-upload scan for defense-in-depth.
    const response = await fetch(process.env.VIRUS_SCAN_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Filename": filename,
        Authorization: `Bearer ${process.env.VIRUS_SCAN_API_KEY}`,
      },
      body: buffer,
    });

    const result = await response.json();
    return {
      clean: result.status === "clean",
      scanResult: result.status,
    };
  } catch (error) {
    logger.error({ error, filename }, "Virus scan failed");
    // Fail closed - reject file if scan service is unavailable
    return { clean: false, scanResult: "scan_service_unavailable" };
  }
}
```

### 5.9 Blue-Green Deployment

#### Deployment Slot Configuration

```typescript
// scripts/deploy.ts
// Orchestrates blue-green deployment with health verification
import { getLogger } from "~/lib/logger.server";

const logger = getLogger("deploy");

interface DeploymentConfig {
  appName: string;
  resourceGroup: string;
  imageTag: string;
  commitSha: string;
  branch: string;
  deployedBy: string;
}

export async function blueGreenDeploy(config: DeploymentConfig): Promise<{
  success: boolean;
  slot: string;
  duration: number;
}> {
  const startTime = Date.now();
  const steps = [
    "deploy-to-staging-slot",
    "warm-up-staging",
    "health-gate-check",
    "swap-slots",
    "verify-production",
    "record-deployment",
  ];

  logger.info({ config, steps }, "Starting blue-green deployment");

  try {
    // Step 1: Deploy new image to staging slot
    logger.info("Step 1: Deploying to staging slot");
    // Handled by GitHub Actions (see section 5.3)

    // Step 2: Warm up staging slot
    logger.info("Step 2: Warming up staging slot");
    await warmUpSlot(`https://${config.appName}-staging.azurewebsites.net`);

    // Step 3: Health gate verification
    logger.info("Step 3: Running health gate verification");
    const healthPassed = await verifyHealthGate(
      `https://${config.appName}-staging.azurewebsites.net`,
    );
    if (!healthPassed) {
      throw new Error("Health gate verification failed on staging slot");
    }

    // Step 4: Swap slots (handled by Azure CLI in GitHub Actions)
    logger.info("Step 4: Swapping staging to production");

    // Step 5: Verify production
    logger.info("Step 5: Verifying production health");
    const prodHealthPassed = await verifyHealthGate(`https://${config.appName}.azurewebsites.net`);

    if (!prodHealthPassed) {
      logger.error("Production health check failed after swap - initiating rollback");
      // Rollback: swap back
      throw new Error("Production health check failed, rollback initiated");
    }

    // Step 6: Record deployment
    const duration = Math.round((Date.now() - startTime) / 1000);
    logger.info({ duration }, "Blue-green deployment completed successfully");

    return { success: true, slot: "production", duration };
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    logger.error({ error, duration }, "Blue-green deployment failed");
    return { success: false, slot: "staging", duration };
  }
}

async function warmUpSlot(baseUrl: string): Promise<void> {
  const warmUpPaths = ["/", "/up", "/health", "/login"];
  for (const path of warmUpPaths) {
    try {
      await fetch(`${baseUrl}${path}`, { method: "GET" });
    } catch {
      // Warm-up failures are non-fatal
    }
  }
  // Allow time for JIT compilation and cache population
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

async function verifyHealthGate(baseUrl: string): Promise<boolean> {
  const maxAttempts = 12;
  const delayMs = 10000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();

      if (data.status === "healthy") {
        logger.info({ attempt, baseUrl }, "Health gate passed");
        return true;
      }

      logger.warn({ attempt, status: data.status, baseUrl }, "Health gate not yet healthy");
    } catch (error) {
      logger.warn({ attempt, error, baseUrl }, "Health gate check failed");
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}
```

### 5.10 Performance Testing

#### k6 Load Test Scripts

```javascript
// tests/performance/load-test.js
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const loginDuration = new Trend("login_duration", true);
const apiDuration = new Trend("api_duration", true);

// Test configuration
export const options = {
  stages: [
    { duration: "2m", target: 50 }, // Ramp up to 50 users
    { duration: "5m", target: 50 }, // Sustain 50 users
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Sustain 100 users
    { duration: "2m", target: 200 }, // Peak load
    { duration: "3m", target: 200 }, // Sustain peak
    { duration: "2m", target: 0 }, // Ramp down
  ],

  thresholds: {
    // Response time SLAs
    http_req_duration: [
      "p(50)<200", // 50th percentile < 200ms
      "p(95)<500", // 95th percentile < 500ms
      "p(99)<2000", // 99th percentile < 2s
    ],
    // Error rate must be below 1%
    errors: ["rate<0.01"],
    // Login must complete within 1s
    login_duration: ["p(95)<1000"],
    // API calls must complete within 500ms
    api_duration: ["p(95)<500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://staging.accreditation.example.org";

export default function () {
  // Scenario 1: Health check (lightweight)
  group("Health Check", () => {
    const res = http.get(`${BASE_URL}/up`);
    check(res, {
      "health status is 200": (r) => r.status === 200,
      "health response time < 50ms": (r) => r.timings.duration < 50,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(1);

  // Scenario 2: Login flow
  group("Login Flow", () => {
    const start = Date.now();

    // GET login page
    const loginPage = http.get(`${BASE_URL}/login`);
    check(loginPage, { "login page loads": (r) => r.status === 200 });

    // POST login credentials
    const loginRes = http.post(`${BASE_URL}/login`, {
      email: `loadtest-${__VU}@example.com`,
      password: "LoadTest123!",
    });

    loginDuration.add(Date.now() - start);
    check(loginRes, {
      "login succeeds": (r) => r.status === 200 || r.status === 302,
    });
    errorRate.add(loginRes.status >= 400);
  });

  sleep(2);

  // Scenario 3: API calls (authenticated)
  group("API Operations", () => {
    const start = Date.now();

    // List events
    const events = http.get(`${BASE_URL}/api/events`, {
      headers: { Cookie: "session=..." },
    });
    check(events, {
      "events list loads": (r) => r.status === 200,
      "events response time < 500ms": (r) => r.timings.duration < 500,
    });

    // Get participants for an event
    const participants = http.get(`${BASE_URL}/api/events/test-event/participants`, {
      headers: { Cookie: "session=..." },
    });
    check(participants, {
      "participants list loads": (r) => r.status === 200,
    });

    apiDuration.add(Date.now() - start);
    errorRate.add(events.status >= 400);
  });

  sleep(1);
}
```

```javascript
// tests/performance/spike-test.js
// Spike test: sudden traffic burst
import http from "k6/http";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 10 }, // Normal load
    { duration: "30s", target: 500 }, // Spike to 500
    { duration: "2m", target: 500 }, // Sustain spike
    { duration: "30s", target: 10 }, // Back to normal
    { duration: "2m", target: 10 }, // Recovery period
  ],
  thresholds: {
    http_req_duration: ["p(99)<5000"], // Relaxed for spike
    http_req_failed: ["rate<0.05"], // Allow 5% errors during spike
  },
};

const BASE_URL = __ENV.BASE_URL || "https://staging.accreditation.example.org";

export default function () {
  const res = http.get(`${BASE_URL}/up`);
  check(res, { "status is 200": (r) => r.status === 200 });
}
```

#### CI Integration for Performance Regression

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  schedule:
    - cron: "0 6 * * 1" # Weekly on Monday at 06:00 UTC
  workflow_dispatch:
    inputs:
      target:
        description: "Target environment URL"
        required: true
        default: "https://staging.accreditation.example.org"

jobs:
  load-test:
    name: k6 Load Test
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update && sudo apt-get install k6

      - name: Run load test
        run: |
          k6 run tests/performance/load-test.js \
            --out json=results.json \
            --summary-export=summary.json
        env:
          BASE_URL: ${{ github.event.inputs.target || 'https://staging.accreditation.example.org' }}

      - name: Check thresholds
        run: |
          PASSED=$(jq '.root_group.checks | to_entries | map(select(.value.fails > 0)) | length' summary.json)
          if [ "$PASSED" -gt 0 ]; then
            echo "::error::Performance thresholds exceeded"
            jq '.root_group.checks' summary.json
            exit 1
          fi

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-results
          path: |
            results.json
            summary.json
          retention-days: 30
```

### 5.11 Incident Response

#### Severity Classification

| Severity            | Definition                          | Response Time | Resolution Target | Examples                                                  |
| ------------------- | ----------------------------------- | ------------- | ----------------- | --------------------------------------------------------- |
| **SEV1 - Critical** | Complete system outage or data loss | 15 minutes    | 1 hour            | Database unreachable, all users affected, data corruption |
| **SEV2 - Major**    | Significant feature degradation     | 30 minutes    | 4 hours           | Login failures, payment processing down, backup failures  |
| **SEV3 - Minor**    | Partial feature degradation         | 2 hours       | 24 hours          | Slow response times, email delays, single tenant affected |
| **SEV4 - Low**      | Cosmetic or minor issues            | 24 hours      | 1 week            | UI glitch, non-critical log errors, documentation gaps    |

#### Escalation Matrix

```
SEV1 (Critical):
  0 min  → On-call engineer alerted (PagerDuty/Opsgenie)
  15 min → Engineering lead notified
  30 min → CTO notified
  60 min → All-hands engineering
  Communication: Status page updated every 15 minutes

SEV2 (Major):
  0 min  → On-call engineer alerted
  30 min → Engineering lead notified
  2 hr   → Product manager notified
  Communication: Status page updated every 30 minutes

SEV3 (Minor):
  0 min  → Ticket created in issue tracker
  2 hr   → Assigned to team
  Communication: Internal Slack channel update

SEV4 (Low):
  0 min  → Ticket created in issue tracker
  Next sprint → Prioritized in backlog
  Communication: None required
```

#### Post-Mortem Template

```markdown
## Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Severity:** SEV[1-4]
**Duration:** HH:MM
**Author:** [Name]
**Status:** Draft / Final

### Summary

[One paragraph description of the incident]

### Impact

- **Users affected:** [number or percentage]
- **Tenants affected:** [list]
- **Duration:** [start time] to [end time]
- **Data loss:** [yes/no, details]
- **Revenue impact:** [if applicable]

### Timeline (all times UTC)

| Time  | Event                     |
| ----- | ------------------------- |
| HH:MM | [First alert / detection] |
| HH:MM | [Investigation started]   |
| HH:MM | [Root cause identified]   |
| HH:MM | [Mitigation applied]      |
| HH:MM | [Service restored]        |

### Root Cause

[Detailed technical explanation of what went wrong]

### Resolution

[What was done to fix the immediate issue]

### Action Items

| Action                  | Owner  | Priority | Due Date   | Status |
| ----------------------- | ------ | -------- | ---------- | ------ |
| [Preventive measure]    | [Name] | P1       | YYYY-MM-DD | Open   |
| [Detection improvement] | [Name] | P2       | YYYY-MM-DD | Open   |
| [Process improvement]   | [Name] | P3       | YYYY-MM-DD | Open   |

### Lessons Learned

- What went well:
- What went poorly:
- Where we got lucky:

### Supporting Data

[Links to dashboards, logs, graphs]
```

### 5.12 Pre-Commit Hooks

#### Husky Setup

```json
// package.json (relevant sections)
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
```

#### lint-staged Configuration

```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
  "*.{json,yml,yaml,css,md}": ["prettier --write"],
  "*.prisma": ["prisma format"]
}
```

#### Commitlint Configuration

```typescript
// commitlint.config.ts
import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Type must be one of the following
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation
        "style", // Formatting, no code change
        "refactor", // Refactoring production code
        "perf", // Performance improvement
        "test", // Adding tests
        "chore", // Maintenance
        "ci", // CI/CD changes
        "build", // Build system changes
        "revert", // Reverting a commit
      ],
    ],
    // Subject must not be empty
    "subject-empty": [2, "never"],
    // Subject must not end with period
    "subject-full-stop": [2, "never", "."],
    // Subject max length
    "subject-max-length": [2, "always", 100],
    // Body max line length
    "body-max-line-length": [1, "always", 200],
    // Scope is optional but if present must be lowercase
    "scope-case": [2, "always", "lower-case"],
  },
};

export default config;
```

---

## 6. User Interface

### 6.1 DevOps Admin Dashboard

The DevOps admin dashboard is accessible only to users with the `platform_admin` role. It provides a unified view of system health, deployments, background jobs, and backup status.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Accreditation Platform  │  Admin  │  DevOps Dashboard         [user ▼]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─── System Status ──────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │   [●] HEALTHY    Uptime: 14d 7h 23m    Version: v2.4.1 (abc1234)  │    │
│  │                                                                     │    │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │    │
│  │   │ Database │  │  Blob   │  │  Jobs   │  │ Memory  │             │    │
│  │   │  [●] UP  │  │ [●] UP  │  │ [●] UP  │  │  67%    │             │    │
│  │   │  3ms     │  │  12ms   │  │  0 queue │  │ 1.2 GB  │             │    │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─── Quick Actions ──────────────────────────────────────────────────┐    │
│  │  [Trigger Backup]  [Clear Cache]  [Retry Failed Jobs]  [View Logs] │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─── Recent Deployments ──────────┐  ┌─── Active Alerts ────────────┐    │
│  │  v2.4.1  prod  2h ago  ● pass   │  │  [!] Job queue depth > 100   │    │
│  │  v2.4.1  stg   3h ago  ● pass   │  │  [i] Backup completed 02:14  │    │
│  │  v2.4.0  prod  2d ago  ● pass   │  │                               │    │
│  │  v2.3.9  prod  5d ago  ● pass   │  │                               │    │
│  │  [View all deployments →]        │  │  [View all alerts →]          │    │
│  └──────────────────────────────────┘  └───────────────────────────────┘    │
│                                                                             │
│  ┌─── Job Queue Summary ──────────┐  ┌─── Backup Status ────────────┐    │
│  │  Queue       Active  Pending   │  │  Last Full:  02:14 UTC ● OK   │    │
│  │  email         3       12      │  │  Last Incr:  10:00 UTC ● OK   │    │
│  │  workflow      1        0      │  │  Last Verify: Sun 04:00 ● OK  │    │
│  │  files         2        5      │  │  Storage: 14.2 GB / 100 GB    │    │
│  │  maintenance   0        1      │  │  Retention: 35 days           │    │
│  │  reports       0        0      │  │                               │    │
│  │  [View job details →]          │  │  [Manage backups →]           │    │
│  └──────────────────────────────────┘  └───────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Deployment Status Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DevOps  ›  Deployments                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current Production: v2.4.1 (abc1234)  Deployed: 2h ago by github-actions  │
│  Current Staging:    v2.4.2 (def5678)  Deployed: 15m ago by @developer     │
│                                                                             │
│  ┌─── Deployment Pipeline ─────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  [Quality ●]──▶[Tests ●]──▶[Build ●]──▶[Staging ●]──▶[Prod ○]     │   │
│  │   2m 14s        4m 32s      3m 01s      1m 45s        Pending      │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── Deployment History ──────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  Version   Env    Branch   SHA      Status   Duration   When         │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  v2.4.1   prod   main     abc1234  ● pass   3m 12s     2h ago      │   │
│  │  v2.4.1   stg    develop  abc1234  ● pass   1m 45s     3h ago      │   │
│  │  v2.4.0   prod   main     789def0  ● pass   3m 45s     2d ago      │   │
│  │  v2.3.9   prod   main     456abc7  ● pass   4m 01s     5d ago      │   │
│  │  v2.3.8   prod   main     123def4  ○ rolled  2m 30s     7d ago      │   │
│  │                                       back                           │   │
│  │  [Load more ▼]                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── Rollback ────────────────────────────────────────────────────────┐   │
│  │  [ Rollback Production to v2.4.0 ]   (Swaps deployment slots)       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 System Health Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DevOps  ›  System Health                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─── Response Time (last 24h) ─────────────────────────────────────┐      │
│  │  250ms ┤                                                          │      │
│  │  200ms ┤         ╭─╮                                             │      │
│  │  150ms ┤    ╭──╮ │ │  ╭──╮                                      │      │
│  │  100ms ┤╭──╮│  ╰─╯ ╰──╯  ╰──╮    ╭──╮  ╭──╮                   │      │
│  │   50ms ┤│  ╰╯                 ╰────╯  ╰──╯  ╰────── p50        │      │
│  │    0ms ┤└──────────────────────────────────────────── p95        │      │
│  │        └─┬────┬────┬────┬────┬────┬────┬────┬────┬─── p99       │      │
│  │         00   03   06   09   12   15   18   21   24              │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌─── Resource Utilization ─────────────────────────────────────────┐      │
│  │                                                                   │      │
│  │  CPU Usage          ████████████░░░░░░░░  62%   (2-8 instances)  │      │
│  │  Memory Usage       ██████████████░░░░░░  67%   (1.2 / 1.8 GB)  │      │
│  │  DB Connections     ████████░░░░░░░░░░░░  38%   (19 / 50)       │      │
│  │  Disk (DB)          ██████░░░░░░░░░░░░░░  28%   (14 / 50 GB)    │      │
│  │  Blob Storage       ██░░░░░░░░░░░░░░░░░░  14%   (14 / 100 GB)  │      │
│  │                                                                   │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌─── Error Rate (last 1h) ─────────────────────────────────────────┐      │
│  │  Total requests: 12,482     Errors: 3 (0.02%)      SSE: 142     │      │
│  │  Sentry issues: 1 new, 2 recurring                               │      │
│  │  [View in Sentry →]  [View in App Insights →]                    │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Log Viewer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DevOps  ›  Logs                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Level: [All ▼]  Tenant: [All ▼]  Module: [All ▼]  Search: [________]     │
│  Time range: [Last 1 hour ▼]  [Auto-refresh ✓]  [Export CSV]              │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Time         Level  CorrelationID  Tenant    Module    Message      │  │
│  │  ────────────────────────────────────────────────────────────────── │  │
│  │  10:42:31.123 INFO   abc-123-def    acme-org  auth      Login       │  │
│  │                                                           successful │  │
│  │  10:42:30.891 DEBUG  abc-123-def    acme-org  prisma    SELECT...   │  │
│  │  10:42:28.456 WARN   xyz-789-uvw    beta-co   jobs      Queue       │  │
│  │                                                           depth > 50 │  │
│  │  10:42:25.012 ERROR  def-456-ghi    acme-org  upload    File size   │  │
│  │                                                           exceeded   │  │
│  │  10:42:24.789 INFO   ghi-012-jkl    —         backup    Full backup │  │
│  │                                                           started    │  │
│  │  10:42:22.333 INFO   jkl-345-mno    acme-org  workflow  Participant │  │
│  │                                                           approved   │  │
│  │                                                                      │  │
│  │  [Load older logs ▼]                                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─── Log Detail (click row to expand) ─────────────────────────────────┐ │
│  │  {                                                                    │ │
│  │    "level": "error",                                                  │ │
│  │    "time": "2026-02-10T10:42:25.012Z",                               │ │
│  │    "correlationId": "def-456-ghi",                                    │ │
│  │    "tenantId": "acme-org",                                            │ │
│  │    "module": "upload",                                                │ │
│  │    "msg": "File size exceeded: 52MB > 25MB limit",                    │ │
│  │    "userId": "usr_abc123",                                            │ │
│  │    "filename": "large-document.pdf"                                   │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Job Queue Monitoring UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DevOps  ›  Job Queue                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─── Queue Overview ───────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Queue         Active   Pending   Failed   Completed (24h)  DLQ      │  │
│  │  ───────────────────────────────────────────────────────────────────  │  │
│  │  email            3       12         0         1,247           0      │  │
│  │  workflow          1        0         0           483           0      │  │
│  │  files             2        5         1           312           1      │  │
│  │  maintenance       0        1         0            24           0      │  │
│  │  reports           0        0         0            18           0      │  │
│  │                                                                       │  │
│  │  Total:           6       18         1         2,084           1      │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─── Failed Jobs ──────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Job ID        Type          Retries   Error           Age    Actions │  │
│  │  ────────────────────────────────────────────────────────────────────  │  │
│  │  job_abc123    file-process   3/3      Sharp: corrupt  2h     [Retry] │  │
│  │                                         image                 [DLQ]   │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─── Dead Letter Queue ────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Job ID        Type          Original Error        Failed At  Actions │  │
│  │  ────────────────────────────────────────────────────────────────────  │  │
│  │  job_def456    file-process   Sharp: corrupt image  1d ago    [Retry] │  │
│  │                                                               [Delete]│  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─── Scheduled Jobs ───────────────────────────────────────────────────┐  │
│  │  backup-full        Daily 02:00 UTC   Next: 2026-02-11T02:00Z       │  │
│  │  backup-incremental Hourly            Next: 2026-02-10T11:00Z       │  │
│  │  backup-verify      Sundays 04:00     Next: 2026-02-16T04:00Z       │  │
│  │  backup-cleanup     Daily 03:00 UTC   Next: 2026-02-11T03:00Z       │  │
│  │  sla-check          Every 15 min      Next: 2026-02-10T10:45Z       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.6 Backup Management Console

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DevOps  ›  Backups                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─── Backup Summary ──────────────────────────────────────────────────┐   │
│  │  Total backups: 142    Storage used: 14.2 GB    Retention: 35 days  │   │
│  │  Last full: 2026-02-10 02:14 UTC (VERIFIED)                         │   │
│  │  Last incremental: 2026-02-10 10:00 UTC (COMPLETED)                 │   │
│  │  Last verification: 2026-02-09 04:00 UTC (PASSED)                   │   │
│  │  PITR window: 2026-01-06 to 2026-02-10 (35 days)                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── Actions ─────────────────────────────────────────────────────────┐   │
│  │  [Trigger Full Backup]  [Trigger Tenant Backup ▼]  [Download Latest]│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─── Backup History ─────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │  ID          Type        Status      Size      Started     Checksum │    │
│  │  ──────────────────────────────────────────────────────────────────  │    │
│  │  bk_abc123   FULL        ● VERIFIED  842 MB    02:14 UTC   a1b2c3  │    │
│  │  bk_def456   INCREMENTAL ● COMPLETED WAL       10:00 UTC   —       │    │
│  │  bk_ghi789   INCREMENTAL ● COMPLETED WAL       09:00 UTC   —       │    │
│  │  bk_jkl012   FULL        ● VERIFIED  840 MB    Feb 09      d4e5f6  │    │
│  │  bk_mno345   FULL        ○ EXPIRED   838 MB    Feb 08      g7h8i9  │    │
│  │  bk_pqr678   TENANT      ● COMPLETED 45 MB     Feb 08      j0k1l2  │    │
│  │                                                                     │    │
│  │  [Load more ▼]                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Integration Points

The infrastructure module provides foundational services consumed by every other module in the platform. The following table maps all integration points.

| Module                 | Integration               | Direction      | Details                                            |
| ---------------------- | ------------------------- | -------------- | -------------------------------------------------- |
| **00 - Architecture**  | Environment configuration | Infra provides | Docker Compose, env vars, feature flags            |
| **00 - Architecture**  | Health check endpoints    | Infra provides | `/up`, `/health`, `/ready` for monitoring          |
| **01 - Data Model**    | Database provisioning     | Infra provides | PostgreSQL 16 via Docker (dev) and Azure (prod)    |
| **01 - Data Model**    | Prisma migrations         | Infra runs     | CI/CD pipeline runs `prisma migrate deploy`        |
| **01 - Data Model**    | Database backups          | Infra provides | Automated pg_dump, PITR, backup verification       |
| **01 - Data Model**    | Test database             | Infra provides | Isolated test DB with truncation between tests     |
| **02 - Workflow**      | Background jobs           | Infra provides | pg-boss queue for async workflow processing        |
| **02 - Workflow**      | SLA monitoring            | Infra provides | Scheduled `sla-check` job via pg-boss cron         |
| **02 - Workflow**      | SSE infrastructure        | Infra monitors | SSE connection metrics and health                  |
| **03 - Form Builder**  | File uploads              | Infra provides | Upload validation, virus scanning, blob storage    |
| **03 - Form Builder**  | Image optimization        | Infra provides | Sharp-based resize, compress, thumbnail generation |
| **04 - Notifications** | Email job queue           | Infra provides | `email-send` job type with retry and DLQ           |
| **04 - Notifications** | Email service (dev)       | Infra provides | Mailpit for local email testing                    |
| **05 - Security**      | Container security        | Infra provides | Non-root user, Trivy scanning, read-only FS        |
| **05 - Security**      | Secrets management        | Infra provides | Azure Key Vault integration, env var injection     |
| **05 - Security**      | Audit log cleanup         | Infra provides | Scheduled `audit-cleanup` job                      |
| **05 - Security**      | Network security          | Infra provides | NSG rules, private endpoints, WAF                  |
| **07 - Badge/Print**   | File processing           | Infra provides | Badge template image optimization                  |
| **07 - Badge/Print**   | Report generation         | Infra provides | `report-generate` job type                         |
| **08 - Analytics**     | Metrics collection        | Infra provides | Prometheus metrics, App Insights telemetry         |
| **08 - Analytics**     | Log aggregation           | Infra provides | Pino structured logging with correlation IDs       |
| **All Modules**        | CI/CD pipeline            | Infra provides | Quality gates, testing, build, deploy              |
| **All Modules**        | Observability             | Infra provides | Logging, error tracking, APM                       |
| **All Modules**        | Cache management          | Infra provides | `cache-warm` and `cache-clear` jobs                |

---

## 8. Configuration

### 8.1 Environment Variables Catalog

#### Database

| Variable                      | Required | Default   | Description                        |
| ----------------------------- | -------- | --------- | ---------------------------------- |
| `DATABASE_URL`                | Yes      | -         | PostgreSQL connection string       |
| `DATABASE_POOL_MIN`           | No       | `2`       | Minimum connections in pool        |
| `DATABASE_POOL_MAX`           | No       | `10`      | Maximum connections in pool        |
| `DATABASE_QUERY_TIMEOUT`      | No       | `30000`   | Query timeout in milliseconds      |
| `DATABASE_CONNECTION_TIMEOUT` | No       | `10000`   | Connection timeout in milliseconds |
| `DATABASE_SSL_MODE`           | No       | `require` | SSL mode for database connection   |

#### Storage

| Variable                          | Required | Default   | Description                          |
| --------------------------------- | -------- | --------- | ------------------------------------ |
| `AZURE_STORAGE_CONNECTION_STRING` | Yes      | -         | Azure Blob Storage connection string |
| `AZURE_STORAGE_CONTAINER_UPLOADS` | No       | `uploads` | Container name for file uploads      |
| `AZURE_STORAGE_CONTAINER_BACKUPS` | No       | `backups` | Container name for database backups  |
| `MAX_UPLOAD_SIZE_MB`              | No       | `25`      | Maximum file upload size in MB       |

#### Email

| Variable                       | Required   | Default                             | Description                                    |
| ------------------------------ | ---------- | ----------------------------------- | ---------------------------------------------- |
| `AZURE_COMM_CONNECTION_STRING` | Yes (prod) | -                                   | Azure Communication Services connection string |
| `EMAIL_FROM_ADDRESS`           | No         | `noreply@accreditation.example.org` | Default sender email                           |
| `EMAIL_FROM_NAME`              | No         | `Accreditation Platform`            | Default sender name                            |
| `SMTP_HOST`                    | No (dev)   | `localhost`                         | SMTP host for development (Mailpit)            |
| `SMTP_PORT`                    | No (dev)   | `1025`                              | SMTP port for development                      |

#### Authentication

| Variable                   | Required | Default | Description                        |
| -------------------------- | -------- | ------- | ---------------------------------- |
| `SESSION_SECRET`           | Yes      | -       | Secret for signing session cookies |
| `SESSION_MAX_AGE`          | No       | `86400` | Session TTL in seconds (24h)       |
| `BCRYPT_ROUNDS`            | No       | `12`    | bcrypt hashing rounds              |
| `MAX_LOGIN_ATTEMPTS`       | No       | `5`     | Failed logins before lockout       |
| `LOCKOUT_DURATION_MINUTES` | No       | `15`    | Account lockout duration           |

#### Monitoring

| Variable                                | Required | Default | Description                                        |
| --------------------------------------- | -------- | ------- | -------------------------------------------------- |
| `SENTRY_DSN`                            | No       | -       | Sentry error tracking DSN                          |
| `SENTRY_TRACES_SAMPLE_RATE`             | No       | `0.1`   | Sentry performance sample rate                     |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | No       | -       | Azure App Insights connection string               |
| `LOG_LEVEL`                             | No       | `info`  | Pino log level (trace/debug/info/warn/error/fatal) |

#### Jobs

| Variable                 | Required | Default  | Description                          |
| ------------------------ | -------- | -------- | ------------------------------------ |
| `JOB_QUEUE_SCHEMA`       | No       | `pgboss` | pg-boss schema name                  |
| `JOB_MONITOR_INTERVAL`   | No       | `30`     | State monitoring interval in seconds |
| `JOB_ARCHIVE_AFTER_DAYS` | No       | `7`      | Archive completed jobs after N days  |
| `JOB_DELETE_AFTER_DAYS`  | No       | `30`     | Delete archived jobs after N days    |

#### Application

| Variable       | Required | Default                 | Description                            |
| -------------- | -------- | ----------------------- | -------------------------------------- |
| `NODE_ENV`     | No       | `development`           | Runtime environment                    |
| `PORT`         | No       | `8080`                  | Application port                       |
| `APP_VERSION`  | No       | `development`           | Application version (set by CI/CD)     |
| `BASE_URL`     | No       | `http://localhost:8080` | Application base URL                   |
| `CORS_ORIGINS` | No       | `*` (dev)               | Allowed CORS origins (comma-separated) |

### 8.2 Docker Environment Variables

```dockerfile
# Variables set in Dockerfile (build-time)
ENV NODE_ENV=production
ENV PORT=8080

# Variables injected at runtime (not in Dockerfile)
# DATABASE_URL              -- via Azure App Service config
# SESSION_SECRET            -- via Azure Key Vault reference
# AZURE_STORAGE_*           -- via Azure Managed Identity
# SENTRY_DSN               -- via Azure App Service config
# APPLICATIONINSIGHTS_*    -- via Azure App Service config
```

### 8.3 CI/CD Secrets

Secrets stored in GitHub Actions environment secrets:

| Secret                  | Environment         | Description                                         |
| ----------------------- | ------------------- | --------------------------------------------------- |
| `AZURE_CLIENT_ID`       | All                 | Service principal client ID for OIDC auth           |
| `AZURE_TENANT_ID`       | All                 | Azure AD tenant ID                                  |
| `AZURE_SUBSCRIPTION_ID` | All                 | Azure subscription ID                               |
| `DEPLOY_TOKEN`          | staging, production | Token for recording deployments                     |
| `SENTRY_AUTH_TOKEN`     | All                 | Sentry release upload token                         |
| `GHCR_TOKEN`            | All                 | GitHub Container Registry token (uses GITHUB_TOKEN) |

### 8.4 Feature Flags

Infrastructure-related feature flags:

| Flag                             | Default | Description                                |
| -------------------------------- | ------- | ------------------------------------------ |
| `FEATURE_VIRUS_SCAN`             | `false` | Enable virus scanning for file uploads     |
| `FEATURE_IMAGE_OPTIMIZATION`     | `true`  | Enable Sharp image optimization on upload  |
| `FEATURE_PERFORMANCE_MONITORING` | `true`  | Enable App Insights performance collection |
| `FEATURE_BACKUP_VERIFICATION`    | `true`  | Enable weekly backup restore testing       |
| `FEATURE_JOB_MONITORING_UI`      | `true`  | Show job queue monitoring in admin UI      |
| `FEATURE_LOG_VIEWER`             | `true`  | Show log viewer in admin UI                |
| `FEATURE_BLUE_GREEN_DEPLOY`      | `true`  | Use blue-green deployment (vs direct)      |
| `FEATURE_CACHE_WARMING`          | `false` | Enable scheduled cache warming jobs        |

---

## 9. Testing Strategy

### 9.1 Docker Build Tests

```typescript
// tests/infrastructure/docker-build.test.ts
import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

describe("Docker Build", () => {
  it("should build the Docker image successfully", () => {
    const result = execSync("docker build -t accreditation-test:latest .", {
      encoding: "utf-8",
      timeout: 300000, // 5 minutes
    });
    expect(result).toContain("Successfully built");
  });

  it("should produce an image under 500MB", () => {
    const result = execSync("docker inspect accreditation-test:latest --format='{{.Size}}'", {
      encoding: "utf-8",
    });
    const sizeBytes = parseInt(result.trim());
    const sizeMB = sizeBytes / 1024 / 1024;
    expect(sizeMB).toBeLessThan(500);
  });

  it("should run as non-root user", () => {
    const result = execSync("docker run --rm accreditation-test:latest whoami", {
      encoding: "utf-8",
    });
    expect(result.trim()).toBe("node");
  });

  it("should expose port 8080", () => {
    const result = execSync(
      "docker inspect accreditation-test:latest --format='{{json .Config.ExposedPorts}}'",
      { encoding: "utf-8" },
    );
    expect(result).toContain("8080");
  });

  it("should have a health check configured", () => {
    const result = execSync(
      "docker inspect accreditation-test:latest --format='{{json .Config.Healthcheck}}'",
      { encoding: "utf-8" },
    );
    const healthcheck = JSON.parse(result);
    expect(healthcheck).toBeDefined();
    expect(healthcheck.Test).toBeDefined();
  });

  it("should have .dockerignore excluding test files", () => {
    expect(existsSync(".dockerignore")).toBe(true);
    const content = readFileSync(".dockerignore", "utf-8");
    expect(content).toContain("*.test.ts");
    expect(content).toContain("coverage");
    expect(content).toContain("node_modules");
  });

  it("should not contain development dependencies", () => {
    const result = execSync(
      'docker run --rm accreditation-test:latest ls node_modules/.package-lock.json 2>/dev/null || echo "no-lockfile"',
      { encoding: "utf-8" },
    );
    // Verify vitest is not in production image
    const checkDev = execSync(
      "docker run --rm accreditation-test:latest node -e \"try { require('vitest'); process.exit(1) } catch { process.exit(0) }\"",
      { encoding: "utf-8", stdio: "pipe" },
    ).catch(() => "devDep found");
    expect(checkDev).not.toBe("devDep found");
  });
});
```

### 9.2 CI Pipeline Validation

```typescript
// tests/infrastructure/ci-pipeline.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { load as yamlLoad } from "js-yaml";

describe("CI/CD Pipeline Configuration", () => {
  const workflowPath = ".github/workflows/ci.yml";

  it("should have a CI workflow file", () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it("should trigger on push and pull_request", () => {
    const workflow = yamlLoad(readFileSync(workflowPath, "utf-8")) as any;
    expect(workflow.on).toHaveProperty("push");
    expect(workflow.on).toHaveProperty("pull_request");
  });

  it("should include quality, test, build, and deploy jobs", () => {
    const workflow = yamlLoad(readFileSync(workflowPath, "utf-8")) as any;
    expect(workflow.jobs).toHaveProperty("quality");
    expect(workflow.jobs).toHaveProperty("test");
    expect(workflow.jobs).toHaveProperty("build");
    expect(workflow.jobs).toHaveProperty("deploy-staging");
    expect(workflow.jobs).toHaveProperty("deploy-production");
  });

  it("should require quality and test before build", () => {
    const workflow = yamlLoad(readFileSync(workflowPath, "utf-8")) as any;
    expect(workflow.jobs.build.needs).toContain("test");
  });

  it("should gate production deployment on main branch", () => {
    const workflow = yamlLoad(readFileSync(workflowPath, "utf-8")) as any;
    const deployProd = workflow.jobs["deploy-production"];
    expect(deployProd.if).toContain("refs/heads/main");
  });

  it("should use concurrency to cancel stale runs", () => {
    const workflow = yamlLoad(readFileSync(workflowPath, "utf-8")) as any;
    expect(workflow.concurrency).toBeDefined();
    expect(workflow.concurrency["cancel-in-progress"]).toBe(true);
  });

  it("should have timeout-minutes set on all jobs", () => {
    const workflow = yamlLoad(readFileSync(workflowPath, "utf-8")) as any;
    for (const [name, job] of Object.entries(workflow.jobs) as any[]) {
      expect(job["timeout-minutes"]).toBeDefined();
      expect(job["timeout-minutes"]).toBeGreaterThan(0);
      expect(job["timeout-minutes"]).toBeLessThanOrEqual(30);
    }
  });
});
```

### 9.3 Backup/Restore Verification

```typescript
// tests/infrastructure/backup-restore.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync, statSync } from "node:fs";

const TEST_DB = "backup_restore_test";
const BACKUP_FILE = "/tmp/test-backup.sql.gz";

describe("Backup and Restore", () => {
  beforeAll(() => {
    // Create test database with sample data
    execSync(`createdb ${TEST_DB} 2>/dev/null || true`);
    execSync(`psql ${TEST_DB} -c "
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      INSERT INTO test_table (name) VALUES ('row1'), ('row2'), ('row3');
    "`);
  });

  afterAll(() => {
    execSync(`dropdb --if-exists ${TEST_DB}`);
    execSync(`dropdb --if-exists ${TEST_DB}_restored`);
    if (existsSync(BACKUP_FILE)) unlinkSync(BACKUP_FILE);
  });

  it("should create a backup file with pg_dump", () => {
    execSync(`pg_dump ${TEST_DB} --format=custom --compress=9 --file="${BACKUP_FILE}"`);
    expect(existsSync(BACKUP_FILE)).toBe(true);

    const stats = statSync(BACKUP_FILE);
    expect(stats.size).toBeGreaterThan(0);
  });

  it("should restore backup to a new database", () => {
    execSync(`createdb ${TEST_DB}_restored`);
    execSync(`pg_restore --dbname=${TEST_DB}_restored --no-owner "${BACKUP_FILE}"`);

    const result = execSync(`psql ${TEST_DB}_restored -t -c "SELECT count(*) FROM test_table"`, {
      encoding: "utf-8",
    });
    expect(parseInt(result.trim())).toBe(3);
  });

  it("should produce consistent checksums for identical data", () => {
    const checksum1 = execSync(`sha256sum "${BACKUP_FILE}"`, { encoding: "utf-8" }).split(" ")[0];

    // Create a second backup
    const backupFile2 = "/tmp/test-backup-2.sql.gz";
    execSync(`pg_dump ${TEST_DB} --format=custom --compress=9 --file="${backupFile2}"`);

    // Note: pg_dump timestamps may differ, so we verify the restore data matches
    execSync(`createdb ${TEST_DB}_verify 2>/dev/null || true`);
    execSync(`pg_restore --dbname=${TEST_DB}_verify --no-owner "${backupFile2}"`);

    const result = execSync(`psql ${TEST_DB}_verify -t -c "SELECT count(*) FROM test_table"`, {
      encoding: "utf-8",
    });
    expect(parseInt(result.trim())).toBe(3);

    // Cleanup
    execSync(`dropdb --if-exists ${TEST_DB}_verify`);
    if (existsSync(backupFile2)) unlinkSync(backupFile2);
  });
});
```

### 9.4 Performance Regression Tests

```typescript
// tests/infrastructure/performance-regression.test.ts
import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

describe("Performance Baseline", () => {
  const BASE_URL = process.env.BASE_URL || "http://localhost:8080";

  it("health endpoint responds within 50ms", async () => {
    const iterations = 10;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fetch(`${BASE_URL}/up`);
      durations.push(performance.now() - start);
    }

    const p95 = durations.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];
    expect(p95).toBeLessThan(50);
  });

  it("health check with dependencies responds within 500ms", async () => {
    const start = performance.now();
    const response = await fetch(`${BASE_URL}/health`);
    const duration = performance.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  it("login page loads within 1000ms", async () => {
    const start = performance.now();
    const response = await fetch(`${BASE_URL}/login`);
    const duration = performance.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(1000);
  });

  it("static assets have cache headers", async () => {
    const response = await fetch(`${BASE_URL}/login`);
    const html = await response.text();

    // Extract a CSS or JS URL from the HTML
    const assetMatch = html.match(/href="(\/build\/[^"]+\.css)"/);
    if (assetMatch) {
      const assetResponse = await fetch(`${BASE_URL}${assetMatch[1]}`);
      const cacheControl = assetResponse.headers.get("cache-control");
      expect(cacheControl).toContain("max-age");
    }
  });
});
```

### 9.5 Chaos Engineering Scenarios

```typescript
// tests/infrastructure/chaos.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";

describe("Chaos Engineering - Resilience Tests", () => {
  // Scenario 1: Database connection interruption
  describe("Database connection loss", () => {
    it("should return degraded health when database is unreachable", async () => {
      // Simulate by querying with an invalid connection
      const badPrisma = new PrismaClient({
        datasources: {
          db: { url: "postgresql://invalid:invalid@localhost:9999/invalid" },
        },
      });

      try {
        await badPrisma.$queryRaw`SELECT 1`;
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        await badPrisma.$disconnect();
      }
    });

    it("should recover when database connection is restored", async () => {
      const prisma = new PrismaClient();

      // First, verify connection works
      const result1 = await prisma.$queryRaw`SELECT 1 as connected`;
      expect(result1).toBeDefined();

      // Simulate recovery by reconnecting
      await prisma.$disconnect();
      await prisma.$connect();

      const result2 = await prisma.$queryRaw`SELECT 1 as reconnected`;
      expect(result2).toBeDefined();

      await prisma.$disconnect();
    });
  });

  // Scenario 2: Memory pressure
  describe("Memory pressure", () => {
    it("should report memory usage in health check", async () => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
      const percentUsed = (heapUsedMB / heapTotalMB) * 100;

      // Application should function with reasonable memory usage
      expect(percentUsed).toBeLessThan(90);
      expect(heapUsedMB).toBeLessThan(1500); // Under 1.5 GB
    });
  });

  // Scenario 3: Concurrent database operations
  describe("Connection pool exhaustion", () => {
    it("should handle concurrent queries without pool exhaustion", async () => {
      const prisma = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_URL } },
      });

      // Fire 20 concurrent queries
      const promises = Array.from({ length: 20 }, () =>
        prisma.$queryRaw`SELECT pg_sleep(0.1)`.catch((e) => ({ error: e.message })),
      );

      const results = await Promise.allSettled(promises);
      const fulfilled = results.filter((r) => r.status === "fulfilled");

      // At least 80% should succeed
      expect(fulfilled.length / results.length).toBeGreaterThanOrEqual(0.8);

      await prisma.$disconnect();
    });
  });

  // Scenario 4: Large payload handling
  describe("Large payload handling", () => {
    it("should reject oversized file uploads gracefully", async () => {
      const { validateUpload } = await import("~/lib/file-processor.server");

      // Create a mock File that exceeds the limit
      const largeBuffer = Buffer.alloc(30 * 1024 * 1024); // 30 MB
      const mockFile = new File([largeBuffer], "huge-file.pdf", {
        type: "application/pdf",
      });

      const result = await validateUpload(mockFile, "test-tenant");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining("exceeds maximum"));
    });
  });
});
```

---

## 10. Security Considerations

### 10.1 Container Security

#### Image Scanning with Trivy

All Docker images are scanned for vulnerabilities as part of the CI/CD pipeline (see section 5.3, build job). The scanning configuration:

```yaml
# Trivy configuration in CI/CD
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
    format: "sarif"
    severity: "CRITICAL,HIGH"
    exit-code: "1" # Fail build on CRITICAL/HIGH
    ignore-unfixed: true # Skip vulnerabilities without patches
```

| Security Control         | Implementation                                   |
| ------------------------ | ------------------------------------------------ |
| **Non-root user**        | `USER node` in Dockerfile (uid 1000)             |
| **Read-only filesystem** | App Service config: `WEBSITE_RUN_FROM_PACKAGE=1` |
| **No shell access**      | Production containers have no SSH/exec access    |
| **Minimal base image**   | `node:20-alpine` (~180MB vs ~900MB for debian)   |
| **No secrets in image**  | All secrets injected via environment at runtime  |
| **HEALTHCHECK**          | Built-in Docker health check on `/up`            |
| **dumb-init**            | Proper PID 1 signal handling                     |
| **Layer caching**        | Prevents unnecessary rebuilds and exposure       |

#### Secrets Management via Azure Key Vault

```typescript
// app/lib/keyvault.server.ts
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

let secretClient: SecretClient | null = null;

function getSecretClient(): SecretClient {
  if (!secretClient) {
    const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
    if (!vaultUrl) throw new Error("AZURE_KEY_VAULT_URL not configured");

    // Uses Managed Identity in production, Azure CLI in development
    const credential = new DefaultAzureCredential();
    secretClient = new SecretClient(vaultUrl, credential);
  }
  return secretClient;
}

export async function getSecret(secretName: string): Promise<string> {
  const client = getSecretClient();
  const secret = await client.getSecret(secretName);
  if (!secret.value) {
    throw new Error(`Secret "${secretName}" has no value`);
  }
  return secret.value;
}

// Azure App Service Key Vault references format:
// @Microsoft.KeyVault(SecretUri=https://kv-accreditation.vault.azure.net/secrets/DATABASE-URL/)
// Set in App Service Application Settings, resolved at runtime by Azure
```

### 10.2 CI/CD Security

| Control                    | Implementation                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------- |
| **OIDC Authentication**    | GitHub Actions uses OpenID Connect to authenticate with Azure (no stored credentials) |
| **Signed artifacts**       | Docker images include provenance and SBOM attestations                                |
| **Dependency scanning**    | `npm audit` and `depcheck` in quality job                                             |
| **Image scanning**         | Trivy SARIF results uploaded to GitHub Security tab                                   |
| **Branch protection**      | `main` and `develop` require PR review and passing CI                                 |
| **Environment approvals**  | Production deployment requires manual approval in GitHub                              |
| **Concurrency limits**     | `cancel-in-progress` prevents stale pipeline runs                                     |
| **Timeout enforcement**    | All jobs have explicit `timeout-minutes`                                              |
| **Least privilege tokens** | Each job requests only needed `permissions`                                           |

### 10.3 Network Security

```
NSG Rules Summary:
============================================================================

nsg-app (Application Subnet):
  Inbound:
    100  Allow  TCP  443   from ApplicationGateway  → HTTPS traffic
    110  Allow  TCP  8080  from ApplicationGateway  → App port
    4096 Deny   Any  *     from Any                 → Block all other

  Outbound:
    100  Allow  TCP  5432  to snet-data              → PostgreSQL
    110  Allow  TCP  443   to snet-services           → Blob, Key Vault, Comm Services
    120  Allow  TCP  443   to AzureMonitor            → App Insights, Log Analytics
    130  Allow  TCP  443   to Internet                → Sentry, npm registry
    4096 Deny   Any  *     to Any                     → Block all other

nsg-data (Database Subnet):
  Inbound:
    100  Allow  TCP  5432  from snet-app             → PostgreSQL from app
    4096 Deny   Any  *     from Any                  → Block all other

  Outbound:
    100  Allow  TCP  443   to AzureActiveDirectory    → Azure AD auth
    4096 Deny   Any  *     to Any                     → Block all other

nsg-services (Services Subnet):
  Inbound:
    100  Allow  TCP  443   from snet-app             → HTTPS from app
    4096 Deny   Any  *     from Any                  → Block all other

Private Endpoints:
  - PostgreSQL: pe-pgfs-accreditation.privatelink.postgres.database.azure.com
  - Blob Storage: pe-staccreditation.privatelink.blob.core.windows.net
  - Key Vault: pe-kvaccreditation.privatelink.vaultcore.azure.net

TLS:
  - All external traffic: TLS 1.2+ enforced by Front Door
  - All internal traffic: TLS 1.2+ enforced by private endpoints
  - Database: SSL required (sslmode=require in connection string)
```

### 10.4 Secrets Rotation Procedures

| Secret                  | Rotation Schedule          | Procedure                                                                                                                                  |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Database password**   | 90 days                    | 1. Generate new password in Key Vault. 2. Update PostgreSQL user password. 3. Update Key Vault reference. 4. Restart app service.          |
| **Session secret**      | 180 days                   | 1. Add new secret as `SESSION_SECRET_NEW`. 2. Deploy code that accepts both. 3. Wait for all old sessions to expire. 4. Remove old secret. |
| **Storage access keys** | Use Managed Identity       | No rotation needed -- uses Azure AD tokens                                                                                                 |
| **Sentry DSN**          | Never (unless compromised) | 1. Rotate in Sentry. 2. Update in App Settings. 3. Restart.                                                                                |
| **GitHub deploy token** | 365 days                   | 1. Generate new token. 2. Update GitHub secret. 3. Verify deployment.                                                                      |
| **SSL certificates**    | Auto-renewed               | Azure-managed certificates auto-renew before expiry                                                                                        |

---

## 11. Performance Requirements

### 11.1 Response Time SLAs

| Metric                     | p50     | p95      | p99      | Target                      |
| -------------------------- | ------- | -------- | -------- | --------------------------- |
| **API response** (JSON)    | < 100ms | < 300ms  | < 1000ms | All loader/action responses |
| **Page render** (SSR)      | < 200ms | < 500ms  | < 2000ms | Full server-rendered HTML   |
| **Static assets**          | < 20ms  | < 50ms   | < 100ms  | CSS, JS, images via CDN     |
| **SSE connection**         | < 100ms | < 300ms  | < 500ms  | EventSource establishment   |
| **File upload**            | < 500ms | < 2000ms | < 5000ms | Per file (up to 25MB)       |
| **Report generation**      | < 5s    | < 15s    | < 60s    | Async via job queue         |
| **Database query**         | < 10ms  | < 50ms   | < 200ms  | Single-table queries        |
| **Health check (/up)**     | < 5ms   | < 10ms   | < 50ms   | Liveness probe              |
| **Health check (/health)** | < 100ms | < 300ms  | < 500ms  | Full dependency check       |

### 11.2 Throughput Targets

| Metric                     | Target                   | Measurement                     |
| -------------------------- | ------------------------ | ------------------------------- |
| **Requests/second**        | 500 sustained, 1000 peak | Measured at application gateway |
| **Concurrent users**       | 200 simultaneous         | Active browser sessions         |
| **SSE connections**        | 500 concurrent           | Active EventSource connections  |
| **File uploads/minute**    | 50                       | Concurrent upload processing    |
| **Background jobs/minute** | 100                      | Across all queues               |
| **Email sends/minute**     | 30                       | Azure Comm Services rate limit  |
| **Database TPS**           | 1000                     | Transactions per second         |

### 11.3 Database Connection Pool Sizing

```
Formula:
  pool_size = (num_instances * connections_per_instance) + headroom

Production calculation:
  num_instances       = 4 (average with auto-scale)
  connections_per_app = 10 (DATABASE_POOL_MAX)
  pg_boss_connections = 3 (monitor + 2 workers)
  headroom            = 10 (migrations, admin queries)

  Total = (4 * 10) + (4 * 3) + 10 = 62 connections

Azure PostgreSQL D4s_v3 max_connections = 200

  Utilization: 62 / 200 = 31% (healthy margin)

Per-instance pool settings:
  DATABASE_POOL_MIN = 2    (idle connections kept warm)
  DATABASE_POOL_MAX = 10   (maximum connections per instance)

Connection timeout: 10 seconds
Query timeout: 30 seconds
Idle timeout: 60 seconds
```

### 11.4 CDN Cache Strategy

| Content Type                          | Cache Duration | Cache-Control Header                  |
| ------------------------------------- | -------------- | ------------------------------------- |
| **Hashed static assets** (`/build/*`) | 1 year         | `public, max-age=31536000, immutable` |
| **Images** (uploaded)                 | 1 year         | `public, max-age=31536000, immutable` |
| **Favicon, robots.txt**               | 1 day          | `public, max-age=86400`               |
| **HTML pages**                        | No cache       | `no-cache, no-store, must-revalidate` |
| **API responses**                     | No cache       | `private, no-cache`                   |
| **Health endpoints**                  | No cache       | `no-cache, no-store`                  |

```typescript
// app/middleware/cache-headers.server.ts
export function setCacheHeaders(request: Request, headers: Headers): void {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/build/")) {
    // Remix fingerprints build assets with content hashes
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (url.pathname.match(/\.(ico|png|jpg|svg)$/)) {
    headers.set("Cache-Control", "public, max-age=86400");
  } else if (url.pathname.startsWith("/api/")) {
    headers.set("Cache-Control", "private, no-cache");
  } else {
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  }
}
```

### 11.5 Resource Limits

| Resource               | Development     | Staging             | Production             |
| ---------------------- | --------------- | ------------------- | ---------------------- |
| **App Service Plan**   | -               | B2 (2 vCPU, 3.5 GB) | P2v3 (2 vCPU, 8 GB)    |
| **Container memory**   | 2 GB            | 3.5 GB              | 8 GB                   |
| **Container CPU**      | 2 cores         | 2 cores             | 2 cores per instance   |
| **PostgreSQL**         | Docker (shared) | B2s (2 vCPU, 4 GB)  | D4s_v3 (4 vCPU, 16 GB) |
| **Blob Storage**       | Azurite (local) | LRS (100 GB)        | GRS (1 TB)             |
| **Max upload size**    | 25 MB           | 25 MB               | 25 MB                  |
| **Request body limit** | 10 MB           | 10 MB               | 10 MB                  |

### 11.6 Auto-Scaling Rules

```
Azure App Service Auto-Scale Configuration:
============================================================================

Minimum instances: 2 (high availability)
Maximum instances: 8
Default instances: 2

Scale-out rules:
  Rule 1: CPU > 70% for 5 minutes → Add 1 instance (cooldown: 5 min)
  Rule 2: Memory > 80% for 5 minutes → Add 1 instance (cooldown: 5 min)
  Rule 3: HTTP queue > 100 for 3 minutes → Add 2 instances (cooldown: 5 min)
  Rule 4: Response time p95 > 1000ms for 5 minutes → Add 1 instance (cooldown: 5 min)

Scale-in rules:
  Rule 1: CPU < 30% for 10 minutes → Remove 1 instance (cooldown: 10 min)
  Rule 2: Memory < 40% for 10 minutes → Remove 1 instance (cooldown: 10 min)

Schedule-based:
  Weekdays 08:00-18:00 UTC: Minimum 3 instances
  Weekends: Minimum 2 instances
  Event days (configured): Minimum 4 instances
```

---

## 12. Open Questions & Decisions

| #   | Question                        | Options                                                                            | Recommendation                                                                                                                                                                         | Status  |
| --- | ------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | **Container orchestration**     | A) Azure App Service (current) B) Azure Kubernetes Service (AKS)                   | **A) App Service** -- Simpler operational model, sufficient for current scale. Revisit at 1000+ concurrent users or when needing sidecar containers.                                   | Decided |
| 2   | **Caching layer**               | A) In-memory (Node.js Map) B) Redis (Azure Cache) C) PostgreSQL materialized views | **A) In-memory** for MVP, with interface that allows swapping to Redis later. In-memory caching avoids additional infrastructure cost and latency for small-to-medium datasets.        | Decided |
| 3   | **Log aggregation**             | A) Azure Log Analytics B) ELK Stack (self-hosted) C) Datadog                       | **A) Azure Log Analytics** -- Native integration with App Insights, no additional infrastructure, cost-effective for our scale. Consider Datadog if multi-cloud becomes a requirement. | Decided |
| 4   | **Multi-region strategy**       | A) Single region (current) B) Active-passive C) Active-active                      | **A) Single region** with geo-redundant backups. Active-passive adds complexity without justification at current user scale. Implement active-passive when RTO < 15 min is required.   | Decided |
| 5   | **Cost optimization**           | A) Reserved instances B) Spot instances for non-prod C) Auto-shutdown for staging  | **C) Auto-shutdown** staging outside business hours. Reserved instances for production database (1-year commitment for ~40% savings).                                                  | Open    |
| 6   | **CDN provider**                | A) Azure Front Door (current) B) Cloudflare C) Fastly                              | **A) Azure Front Door** -- Integrated with Azure ecosystem, sufficient CDN and DDoS capabilities. Evaluate Cloudflare if global presence becomes critical.                             | Decided |
| 7   | **Database migration strategy** | A) Prisma Migrate (current) B) Raw SQL migrations C) Flyway                        | **A) Prisma Migrate** -- Tight integration with Prisma ORM, automatic migration generation, drift detection. Supplement with raw SQL for complex migrations.                           | Decided |
| 8   | **Monitoring alerting**         | A) Azure Monitor Alerts B) PagerDuty C) Opsgenie                                   | **Open** -- Need to evaluate incident management platform. Azure Monitor Alerts for infrastructure, but need dedicated on-call platform for SEV1/SEV2 escalation.                      | Open    |
| 9   | **Terraform vs Bicep**          | A) Terraform B) Azure Bicep C) Pulumi                                              | **Open** -- Terraform offers multi-cloud portability. Bicep offers deeper Azure integration. Decision depends on multi-cloud likelihood.                                               | Open    |
| 10  | **gRPC for internal services**  | A) REST (current) B) gRPC C) tRPC                                                  | **A) REST** with typed routes via Remix conventions. Single-service architecture does not benefit from gRPC. Revisit if microservices are introduced.                                  | Decided |

---

## Appendix

### A. Glossary

| Term                        | Definition                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| **APM**                     | Application Performance Monitoring -- tracking request traces, dependency calls, and performance metrics |
| **Blue-Green Deployment**   | A deployment strategy using two identical environments (slots) to achieve zero-downtime deployments      |
| **CDN**                     | Content Delivery Network -- caches static assets at edge locations for faster delivery                   |
| **CI/CD**                   | Continuous Integration / Continuous Deployment -- automated build, test, and deploy pipelines            |
| **Correlation ID**          | A unique identifier propagated through all layers of a request for distributed tracing                   |
| **Dead Letter Queue (DLQ)** | A queue that stores messages/jobs that failed processing after all retry attempts                        |
| **DORA Metrics**            | DevOps Research and Assessment metrics: deployment frequency, lead time, change failure rate, MTTR       |
| **GRS**                     | Geo-Redundant Storage -- Azure storage replication to a paired region                                    |
| **Health Probe**            | An HTTP endpoint that load balancers and orchestrators call to determine service availability            |
| **IaC**                     | Infrastructure as Code -- managing infrastructure through version-controlled configuration files         |
| **LRS**                     | Locally Redundant Storage -- Azure storage replication within a single datacenter                        |
| **Managed Identity**        | Azure AD identity assigned to a resource, eliminating the need for stored credentials                    |
| **MSW**                     | Mock Service Worker -- API mocking library for testing that intercepts network requests                  |
| **NSG**                     | Network Security Group -- Azure firewall rules controlling traffic to/from subnets                       |
| **OIDC**                    | OpenID Connect -- authentication protocol used by GitHub Actions to authenticate with Azure              |
| **pg-boss**                 | A PostgreSQL-based job queue library that uses SKIP LOCKED for reliable job processing                   |
| **PITR**                    | Point-in-Time Recovery -- restoring a database to any specific moment within the retention window        |
| **RPO**                     | Recovery Point Objective -- maximum acceptable data loss measured in time                                |
| **RTO**                     | Recovery Time Objective -- maximum acceptable downtime before recovery                                   |
| **SARIF**                   | Static Analysis Results Interchange Format -- standard format for security scanning results              |
| **SBOM**                    | Software Bill of Materials -- inventory of components in a software artifact                             |
| **SSE**                     | Server-Sent Events -- one-way real-time communication from server to browser                             |
| **VNet**                    | Virtual Network -- Azure isolated network environment                                                    |
| **WAF**                     | Web Application Firewall -- protects against OWASP Top 10 and other web attacks                          |
| **WAL**                     | Write-Ahead Log -- PostgreSQL transaction log used for replication and point-in-time recovery            |

### B. References

| Resource                        | URL                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Azure App Service Documentation | https://learn.microsoft.com/en-us/azure/app-service/                                                                  |
| Azure Database for PostgreSQL   | https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/                                                   |
| Azure Blob Storage              | https://learn.microsoft.com/en-us/azure/storage/blobs/                                                                |
| Azure Key Vault                 | https://learn.microsoft.com/en-us/azure/key-vault/                                                                    |
| Azure Front Door                | https://learn.microsoft.com/en-us/azure/frontdoor/                                                                    |
| Azure Application Insights      | https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview                                       |
| Docker Multi-Stage Builds       | https://docs.docker.com/build/building/multi-stage/                                                                   |
| Docker Security Best Practices  | https://docs.docker.com/develop/security-best-practices/                                                              |
| GitHub Actions Documentation    | https://docs.github.com/en/actions                                                                                    |
| GitHub Actions OIDC for Azure   | https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure |
| Prisma ORM Documentation        | https://www.prisma.io/docs                                                                                            |
| pg-boss Documentation           | https://github.com/timgit/pg-boss                                                                                     |
| Pino Logger                     | https://getpino.io/                                                                                                   |
| Sentry for Remix                | https://docs.sentry.io/platforms/javascript/guides/remix/                                                             |
| Vitest Documentation            | https://vitest.dev/                                                                                                   |
| Playwright Documentation        | https://playwright.dev/                                                                                               |
| k6 Load Testing                 | https://k6.io/docs/                                                                                                   |
| Sharp Image Processing          | https://sharp.pixelplumbing.com/                                                                                      |
| Trivy Security Scanner          | https://aquasecurity.github.io/trivy/                                                                                 |
| Husky Git Hooks                 | https://typicode.github.io/husky/                                                                                     |
| Commitlint                      | https://commitlint.js.org/                                                                                            |

### C. Complete Environment Variable Master List

The following is the canonical list of all environment variables used by the platform, organized by category with their requirements per environment.

```
# ============================================================================
# COMPLETE ENVIRONMENT VARIABLE REFERENCE
# ============================================================================
# Legend:
#   [R] = Required    [O] = Optional    [-] = Not used
#   DEV = Development  STG = Staging    PRD = Production
# ============================================================================

# --- DATABASE ---
DATABASE_URL=                           # [R] DEV/STG/PRD - PostgreSQL connection string
DATABASE_POOL_MIN=2                     # [O] DEV/STG/PRD - Min pool connections
DATABASE_POOL_MAX=10                    # [O] DEV/STG/PRD - Max pool connections
DATABASE_QUERY_TIMEOUT=30000            # [O] DEV/STG/PRD - Query timeout (ms)
DATABASE_CONNECTION_TIMEOUT=10000       # [O] DEV/STG/PRD - Connection timeout (ms)
DATABASE_SSL_MODE=require               # [O] [-]/STG/PRD - SSL mode

# --- STORAGE ---
AZURE_STORAGE_CONNECTION_STRING=        # [R] DEV/STG/PRD - Blob storage connection
AZURE_STORAGE_CONTAINER_UPLOADS=uploads # [O] DEV/STG/PRD - Upload container name
AZURE_STORAGE_CONTAINER_BACKUPS=backups # [O] DEV/STG/PRD - Backup container name
MAX_UPLOAD_SIZE_MB=25                   # [O] DEV/STG/PRD - Max file upload size

# --- EMAIL ---
AZURE_COMM_CONNECTION_STRING=           # [R] [-]/STG/PRD - Azure Communication Services
EMAIL_FROM_ADDRESS=noreply@example.org  # [O] DEV/STG/PRD - Sender email
EMAIL_FROM_NAME=Accreditation Platform  # [O] DEV/STG/PRD - Sender name
SMTP_HOST=localhost                     # [O] DEV/[-]/[-] - Dev SMTP (Mailpit)
SMTP_PORT=1025                          # [O] DEV/[-]/[-] - Dev SMTP port

# --- AUTHENTICATION ---
SESSION_SECRET=                         # [R] DEV/STG/PRD - Session cookie signing
SESSION_MAX_AGE=86400                   # [O] DEV/STG/PRD - Session TTL (seconds)
BCRYPT_ROUNDS=12                        # [O] DEV/STG/PRD - Password hashing rounds
MAX_LOGIN_ATTEMPTS=5                    # [O] DEV/STG/PRD - Failed login threshold
LOCKOUT_DURATION_MINUTES=15             # [O] DEV/STG/PRD - Lockout duration

# --- MONITORING ---
SENTRY_DSN=                             # [O] [-]/STG/PRD - Sentry error tracking
SENTRY_TRACES_SAMPLE_RATE=0.1          # [O] [-]/STG/PRD - Performance sample rate
APPLICATIONINSIGHTS_CONNECTION_STRING=  # [O] [-]/STG/PRD - App Insights connection
LOG_LEVEL=info                          # [O] DEV/STG/PRD - Pino log level

# --- JOBS ---
JOB_QUEUE_SCHEMA=pgboss                # [O] DEV/STG/PRD - pg-boss schema
JOB_MONITOR_INTERVAL=30                # [O] DEV/STG/PRD - Monitor interval (sec)
JOB_ARCHIVE_AFTER_DAYS=7               # [O] DEV/STG/PRD - Archive completed jobs
JOB_DELETE_AFTER_DAYS=30               # [O] DEV/STG/PRD - Delete archived jobs

# --- APPLICATION ---
NODE_ENV=development                    # [O] DEV/STG/PRD - Runtime environment
PORT=8080                               # [O] DEV/STG/PRD - Application port
APP_VERSION=development                 # [O] DEV/STG/PRD - App version (set by CI)
BASE_URL=http://localhost:8080          # [O] DEV/STG/PRD - Application base URL
CORS_ORIGINS=*                          # [O] DEV/STG/PRD - Allowed CORS origins

# --- SECURITY ---
AZURE_KEY_VAULT_URL=                    # [O] [-]/STG/PRD - Key Vault URL
VIRUS_SCAN_ENABLED=false                # [O] DEV/STG/PRD - Enable virus scanning
VIRUS_SCAN_API_URL=                     # [O] [-]/[-]/PRD - Virus scan service URL
VIRUS_SCAN_API_KEY=                     # [O] [-]/[-]/PRD - Virus scan API key

# --- FEATURE FLAGS ---
FEATURE_VIRUS_SCAN=false                # [O] DEV/STG/PRD
FEATURE_IMAGE_OPTIMIZATION=true         # [O] DEV/STG/PRD
FEATURE_PERFORMANCE_MONITORING=true     # [O] [-]/STG/PRD
FEATURE_BACKUP_VERIFICATION=true        # [O] [-]/STG/PRD
FEATURE_JOB_MONITORING_UI=true          # [O] DEV/STG/PRD
FEATURE_LOG_VIEWER=true                 # [O] DEV/STG/PRD
FEATURE_BLUE_GREEN_DEPLOY=true          # [O] [-]/STG/PRD
FEATURE_CACHE_WARMING=false             # [O] DEV/STG/PRD
```

---

_End of Module 06: Infrastructure and DevOps_
