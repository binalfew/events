# Phase 0: Foundation — Completion Report

> **Date completed:** 2026-02-14
> **Tasks implemented:** P0-00 through P0-10 (excluding P0-07 CI/CD)
> **Commits:** 5 (including initial scaffold)

---

## Table of Contents

1. [Overview](#1-overview)
2. [P0-00 — Project Scaffolding](#2-p0-00--project-scaffolding)
3. [P0-01 — Secret Rotation & Environment Variables](#3-p0-01--secret-rotation--environment-variables)
4. [P0-02 — Pre-Commit Hooks](#4-p0-02--pre-commit-hooks)
5. [P0-03 — Structured Logging](#5-p0-03--structured-logging)
6. [P0-04 — Nonce-Based CSP & Security Middleware](#6-p0-04--nonce-based-csp--security-middleware)
7. [P0-05 — Testing Framework](#7-p0-05--testing-framework)
8. [P0-06 — Containerization](#8-p0-06--containerization)
9. [P0-08 — Error Tracking (Sentry)](#9-p0-08--error-tracking-sentry)
10. [P0-09 — Missing Database Indexes](#10-p0-09--missing-database-indexes)
11. [P0-10 — User Soft Delete](#11-p0-10--user-soft-delete)
12. [Prisma 7 Upgrade](#12-prisma-7-upgrade)
13. [Skipped: P0-07 — CI/CD Pipeline](#13-skipped-p0-07--cicd-pipeline)
14. [Commit History](#14-commit-history)
15. [Complete File Inventory](#15-complete-file-inventory)
16. [Bugs & Gotchas Encountered](#16-bugs--gotchas-encountered)
17. [Architecture Decisions](#17-architecture-decisions)

---

## 1. Overview

Phase 0 establishes the foundational infrastructure for the multi-tenant accreditation platform. Before any feature code is written, these tasks ensure the project has:

- A working development environment with hot reload
- Validated environment variables with fail-fast behavior
- Enforced code quality via pre-commit hooks
- Structured JSON logging with request tracing
- Hardened HTTP security headers (CSP, CORS, rate limiting)
- A complete testing pyramid (unit, integration, e2e)
- Containerized infrastructure services (PostgreSQL, Azurite, Mailpit)
- Error tracking that captures and reports unhandled exceptions
- Optimized database indexes for common query patterns
- Soft-delete support that preserves data instead of destroying it

### Technology Stack

| Layer          | Technology                                 | Version               |
| -------------- | ------------------------------------------ | --------------------- |
| Runtime        | Node.js                                    | 22 LTS                |
| Framework      | React Router 7 + Vite + Express 5          | 7.12.0                |
| Database       | PostgreSQL 16 + Prisma 7 (driver adapters) | 7.4.0                 |
| UI             | React 19, Radix UI, Tailwind CSS 4         | 19.2.4                |
| Forms          | Conform + Zod 4                            | 1.17.0 / 4.3.6        |
| Logging        | Pino (+ pino-pretty for dev)               | 10.3.1                |
| Security       | Helmet, cors, express-rate-limit           | 8.1.0 / 2.8.6 / 8.2.1 |
| Testing        | Vitest 4 + MSW 2 + Playwright 1.58         | See package.json      |
| Error Tracking | Sentry (@sentry/node + @sentry/browser)    | 10.38.0               |

### Commit Summary

```
886971e Initial commit from create-react-router
cc9d31e chore: scaffold react router 7 app with custom express server
2159c70 chore: implement P0-01 (env/secrets), P0-02 (pre-commit hooks), P0-09 (indexes)
1506b23 chore: implement P0-03 (logging), P0-04 (security), P0-06 (containers)
9370d29 chore: implement P0-05 (testing), P0-08 (sentry), P0-10 (soft delete)
```

---

## 2. P0-00 — Project Scaffolding

### What This Task Does

Creates the base application from the React Router 7 template and customizes it with the project's core dependencies, database schema, and directory structure.

### Files Created/Modified

| File                                     | Action   | Purpose                                                                |
| ---------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `server.js`                              | Modified | Entry point — loads dotenv, starts Vite dev server or production build |
| `server/app.ts`                          | Modified | Express app with React Router request handler                          |
| `prisma.config.ts`                       | Created  | Prisma configuration (datasource URL, migration path, seed command)    |
| `prisma/schema.prisma`                   | Created  | Database schema with 5 foundational models                             |
| `prisma/seed.ts`                         | Created  | Seeds a default tenant and admin user                                  |
| `prisma/migrations/20260214141113_init/` | Created  | Initial database migration                                             |
| `app/lib/db.server.ts`                   | Created  | Prisma client singleton (prevents hot-reload connection leaks)         |
| `app/routes/up.tsx`                      | Created  | Health check endpoint (`GET /up` → `200 OK`)                           |
| `app/routes.ts`                          | Modified | Route definitions                                                      |
| `app/components/ui/.gitkeep`             | Created  | Placeholder for future UI components                                   |
| `app/utils/.gitkeep`                     | Created  | Placeholder for future utilities                                       |
| `package.json`                           | Modified | Added all project dependencies                                         |

### Database Schema (5 Models)

The initial Prisma schema defines the identity and event management domain:

```prisma
model Tenant {
  id               String   @id @default(cuid())
  name             String   @unique
  email            String   @unique
  phone            String
  subscriptionPlan String
  // ... billing, feature flags, usage metrics as JSON
  users            User[]
  events           Event[]
}

model User {
  id       String     @id @default(cuid())
  email    String     @unique
  username String     @unique
  name     String?
  status   UserStatus @default(ACTIVE)
  // ... login attempt tracking, lock fields
  tenantId String?
  tenant   Tenant?    @relation(...)
  password Password?
  sessions Session[]
}

model Password {
  hash   String
  userId String @unique
  user   User   @relation(...)
}

model Session {
  id             String   @id @default(cuid())
  expirationDate DateTime
  userId         String
  user           User     @relation(...)
  metadata       Json?
}

model Event {
  id          String      @id @default(cuid())
  name        String
  tenantId    String
  tenant      Tenant      @relation(...)
  status      EventStatus @default(DRAFT)
  startDate   DateTime
  endDate     DateTime
  customData  Json        @default("{}")
}
```

**Key design decisions:**

- `cuid()` for IDs (URL-safe, sortable, collision-resistant)
- `tenantId` on User/Event for multi-tenant isolation
- `customData Json` on Event for runtime-defined fields (the "hybrid schema" pattern)
- `UserStatus` enum: `ACTIVE | INACTIVE | LOCKED | SUSPENDED`
- `EventStatus` enum: `DRAFT | PUBLISHED | CANCELED | COMPLETED | POSTPONED | RESCHEDULED`

### Prisma Client Singleton Pattern

```typescript
// app/lib/db.server.ts (original version, before P0-10 and Prisma 7 modifications)
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Why an adapter?** Prisma 7 removed the built-in Rust query engine and now requires an explicit driver adapter. `@prisma/adapter-pg` uses the `pg` npm package (pure JavaScript PostgreSQL driver) to connect to the database. The connection URL is passed to the adapter, not to PrismaClient.

**Why a singleton?** In development, Vite's hot module replacement (HMR) re-executes modules on every file save. Without caching, each reload creates a new `PrismaClient` instance with its own connection pool. PostgreSQL has a limited number of connections (default: 100), and you'd exhaust them within minutes of active development. The `globalThis` cache ensures only one client exists across HMR cycles.

### Health Check Endpoint

```typescript
// app/routes/up.tsx
export function loader() {
  return new Response("OK", { status: 200 });
}
```

This is a minimal health check used by Docker `HEALTHCHECK`, load balancers, and monitoring. It returns plain text `OK` with status 200. A future improvement could ping the database to verify full connectivity.

### How `server.js` Works

The entry point has two code paths:

**Development mode** (`NODE_ENV=development`):

1. Creates a Vite dev server in middleware mode (`middlewareMode: true`)
2. Uses `viteDevServer.ssrLoadModule("./server/app.ts")` to dynamically load the Express app
3. Vite compiles TypeScript on-the-fly and provides HMR
4. If SSR loading fails, `viteDevServer.ssrFixStacktrace(error)` maps compiled positions back to source

**Production mode** (`NODE_ENV=production`):

1. Serves `/assets/*` with `immutable: true, maxAge: "1y"` (Vite adds content hashes to filenames)
2. Serves other static files with `maxAge: "1h"`
3. Imports the pre-built React Router handler from `./build/server/index.js`

---

## 3. P0-01 — Secret Rotation & Environment Variables

### What This Task Does

Prevents secrets from leaking into version control, documents every environment variable the app uses, and validates them at startup so the server fails fast with a clear error message instead of crashing mysteriously later.

### Files Created/Modified

| File                      | Action   | Purpose                                                           |
| ------------------------- | -------- | ----------------------------------------------------------------- |
| `.env.example`            | Expanded | 45+ documented environment variables with safe placeholder values |
| `app/lib/env.server.ts`   | Created  | Zod schema that validates `process.env` at import time            |
| `server.js`               | Modified | Imports `dotenv/config` and checks required vars before starting  |
| `docs/secret-rotation.md` | Created  | Step-by-step rotation procedures for each secret                  |

### `.env.example` — All Environment Variables

The file is organized into categories:

```bash
# ─── Database ───────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/accreditation"
DATABASE_POOL_MIN=2              # Minimum connections in the pool
DATABASE_POOL_MAX=10             # Maximum connections
DATABASE_QUERY_TIMEOUT=5000      # Query timeout in milliseconds
DATABASE_CONNECTION_TIMEOUT=10000 # Connection timeout in milliseconds

# ─── Authentication ────────────────────────────────────
SESSION_SECRET="generate-a-random-32-char-string"  # Signs session cookies
SESSION_MAX_AGE=2592000000       # 30 days in milliseconds
BCRYPT_ROUNDS=10                 # bcrypt cost factor (higher = slower but safer)
MAX_LOGIN_ATTEMPTS=5             # Failed attempts before account lock
LOCKOUT_DURATION_MINUTES=30      # How long the lock lasts

# ─── Azure Storage ─────────────────────────────────────
AZURE_STORAGE_CONNECTION_STRING="UseDevelopmentStorage=true"  # Azurite for local dev
AZURE_STORAGE_CONTAINER_UPLOADS="uploads"
AZURE_STORAGE_CONTAINER_BACKUPS="backups"
MAX_UPLOAD_SIZE_MB=10

# ─── Azure Communication Services ─────────────────────
AZURE_COMM_CONNECTION_STRING=""  # Email sending service
EMAIL_FROM_ADDRESS="noreply@accredit.io"
EMAIL_FROM_NAME="Accreditation Platform"

# ─── Monitoring ────────────────────────────────────────
SENTRY_DSN=""                    # Empty = Sentry disabled (no-op)
SENTRY_TRACES_SAMPLE_RATE=0.1   # 10% of requests get performance traces
LOG_LEVEL=info                   # Pino log level

# ─── Application ───────────────────────────────────────
NODE_ENV=development
PORT=3000
BASE_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000"  # Comma-separated allowed origins

# ─── Security ─────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Per window per IP
TRUSTED_PROXIES=1                # Number of reverse proxies in front

# ─── Feature Flags ────────────────────────────────────
ENABLE_2FA=false
ENABLE_OFFLINE_MODE=false
ENABLE_WEBHOOKS=false
ENABLE_SSE=true
```

### `app/lib/env.server.ts` — Zod Validation

This file defines a Zod schema and validates `process.env` the moment it's imported. If validation fails, it prints a clear error and calls `process.exit(1)`.

```typescript
import { z } from "zod";

// Custom boolean parser because Zod v4's z.coerce.boolean() is broken for "false"
const booleanString = z.preprocess((v) => {
  if (typeof v === "string") return v === "true" || v === "1";
  if (typeof v === "boolean") return v;
  return false;
}, z.boolean());

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  // ... all other variables with defaults
  ENABLE_2FA: booleanString.default(false),
  ENABLE_OFFLINE_MODE: booleanString.default(false),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error(`\nInvalid environment variables:\n${formatted}\n`);
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
```

**How it works:**

1. `z.coerce.number()` converts string env vars to numbers (e.g., `"3000"` → `3000`)
2. `.default()` provides fallback values for optional variables
3. `safeParse()` collects ALL validation errors at once (not just the first)
4. The exported `env` object is fully typed — IDE autocomplete works on `env.PORT`, `env.DATABASE_URL`, etc.

**The Zod v4 boolean bug:** `z.coerce.boolean()` calls JavaScript's `Boolean()` constructor under the hood. `Boolean("false")` returns `true` because any non-empty string is truthy. The `z.preprocess` workaround explicitly checks for the strings `"true"` and `"1"`.

### `server.js` — Fast-Fail Check

Before the Vite server or Express app is created, `server.js` performs a simple check:

```javascript
import "dotenv/config"; // Load .env file into process.env

const required = ["DATABASE_URL", "SESSION_SECRET"];
for (const name of required) {
  if (!process.env[name]) {
    logger.fatal(
      { variable: name },
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill in the values.`,
    );
    process.exit(1);
  }
}
```

**Why two checks?** The `server.js` check runs immediately at startup (before any imports). The Zod validation in `env.server.ts` runs when React Router loaders import it. The early check ensures the developer sees a helpful error message even before the app framework loads.

---

## 4. P0-02 — Pre-Commit Hooks

### What This Task Does

Automatically formats code and validates commit messages before they enter the git history. This prevents messy diffs, style debates in code review, and non-standard commit messages.

### Files Created/Modified

| File                   | Action   | Purpose                                     |
| ---------------------- | -------- | ------------------------------------------- |
| `.husky/pre-commit`    | Created  | Runs lint-staged before every commit        |
| `.husky/commit-msg`    | Created  | Runs commitlint on the commit message       |
| `.lintstagedrc.json`   | Created  | Defines which tools run on which file types |
| `commitlint.config.ts` | Created  | Enforces Conventional Commits format        |
| `.prettierrc.json`     | Created  | Prettier formatting rules                   |
| `.prettierignore`      | Created  | Files/dirs excluded from formatting         |
| `package.json`         | Modified | Added `"prepare": "husky"` script           |

### How It Works

**Git hooks** are scripts that Git runs at specific points in the commit workflow. Husky makes them easy to manage by storing hook scripts in `.husky/` and installing them via the `prepare` npm script (which runs automatically after `npm install`).

**The pre-commit flow:**

```
Developer runs: git commit -m "feat: add login page"
        │
        ▼
.husky/pre-commit runs
        │
        ▼
npx lint-staged
        │
        ▼
For each staged file, run the matching command:
  *.ts, *.tsx  → prettier --write (auto-format)
  *.json, *.yml, *.css, *.md → prettier --write
  *.prisma → npx prisma format --schema
        │
        ▼
If any command fails → commit is BLOCKED
If all pass → re-stage formatted files → continue to commit-msg hook
        │
        ▼
.husky/commit-msg runs
        │
        ▼
npx commitlint --edit "$1"
        │
        ▼
Validates message follows: type(scope): subject
  type must be: feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert
  subject must not be empty
  subject must not end with a period
  subject max 100 characters
        │
        ▼
If invalid → commit is BLOCKED with explanation
If valid → commit succeeds
```

### `.lintstagedrc.json`

```json
{
  "*.{ts,tsx}": ["prettier --write"],
  "*.{json,yml,yaml,css,md}": ["prettier --write"],
  "*.prisma": ["npx prisma format --schema"]
}
```

**Why lint-staged instead of formatting everything?** Running Prettier on the entire codebase takes time. lint-staged only processes files that are staged for commit, making commits fast.

### `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### `commitlint.config.ts`

```typescript
import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "chore",
        "ci",
        "build",
        "revert",
      ],
    ],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "subject-max-length": [2, "always", 100],
    "body-max-line-length": [2, "always", 200],
    "scope-case": [2, "always", "lower-case"],
  },
};
```

The `[2, "always", ...]` format means: severity 2 (error, blocks commit), condition "always" (rule is always enforced), and the allowed values.

### Conventional Commits Examples

```
feat: add user registration form          ✓
feat(auth): implement 2FA with TOTP       ✓
fix: prevent duplicate event names         ✓
chore: update dependencies                 ✓
Added login page                           ✗ (missing type prefix)
feat: Add login page.                      ✗ (capital A, trailing period)
```

---

## 5. P0-03 — Structured Logging

### What This Task Does

Replaces `console.log` with structured JSON logging using Pino, adds correlation IDs to trace requests across the system, and logs request/response pairs with timing.

### Files Created/Modified

| File                                   | Action   | Purpose                                               |
| -------------------------------------- | -------- | ----------------------------------------------------- |
| `server/logger.js`                     | Created  | Pino logger instance (plain JS for server.js)         |
| `server/correlation.js`                | Created  | AsyncLocalStorage-based correlation ID middleware     |
| `server/request-logger.js`             | Created  | HTTP request/response logging middleware              |
| `app/lib/logger.server.ts`             | Created  | TypeScript Pino logger for app code (loaders/actions) |
| `app/middleware/correlation.server.ts` | Created  | TypeScript correlation utilities for app code         |
| `server.js`                            | Modified | Replaced console.log, removed morgan                  |
| `tsconfig.node.json`                   | Modified | Added `server/*.js` to include list                   |

### Why Two Sets of Files?

The project has a **dual-file architecture**:

```
server.js (Node.js entry point)
  └── imports server/logger.js      ← Plain JavaScript
  └── imports server/correlation.js  ← Plain JavaScript
  └── imports server/request-logger.js

server/app.ts (Vite-compiled Express app)
  └── imports from app/lib/          ← TypeScript, compiled by Vite
  └── imports from app/middleware/
```

`server.js` runs directly in Node.js — it's NOT processed by Vite. It can only import plain `.js` files or npm packages. The `server/` directory (`.js` files) is for this purpose.

`server/app.ts` is loaded via `viteDevServer.ssrLoadModule()` in development and pre-compiled during `npm run build` for production. It CAN import TypeScript files from `app/`.

### `server/logger.js` — The Pino Logger

```javascript
import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,

  // Production: JSON output (machine-parseable for log aggregation)
  ...(isProduction
    ? {
        formatters: {
          level(label) {
            return { level: label };
          }, // "info" instead of 30
        },
      }
    : // Development: colorized, human-readable output
      {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),

  // Fields attached to every log line
  base: {
    service: "accreditation-platform",
    version: process.env.APP_VERSION || "dev",
    environment: process.env.NODE_ENV || "development",
  },

  // Automatically redact sensitive fields
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
});
```

**Production log output:**

```json
{
  "level": "info",
  "time": "2026-02-14T12:00:00.000Z",
  "service": "accreditation-platform",
  "msg": "incoming request",
  "correlationId": "abc-123",
  "method": "GET",
  "url": "/api/events"
}
```

**Development log output:**

```
22:15:30.123 INFO: incoming request
    correlationId: "abc-123"
    method: "GET"
    url: "/api/events"
```

**Why Pino?** Pino is the fastest Node.js logger. It serializes to JSON using a binary protocol and defers pretty-printing to a separate process (`pino-pretty`), so logging never blocks the event loop.

### `server/correlation.js` — Request Tracing

```javascript
import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";

export const asyncLocalStorage = new AsyncLocalStorage();

export function correlationMiddleware(req, res, next) {
  const rawId = req.headers["x-correlation-id"] || req.headers["x-request-id"];
  const correlationId = (Array.isArray(rawId) ? rawId[0] : rawId) || crypto.randomUUID();

  const context = { correlationId, requestPath: req.path };

  res.setHeader("x-correlation-id", correlationId);

  asyncLocalStorage.run(context, () => {
    next();
  });
}
```

**What is AsyncLocalStorage?** It's Node.js's built-in mechanism for propagating context through async operations without passing it explicitly. Think of it as thread-local storage for JavaScript's single-threaded, async model.

**The flow:**

1. Request arrives → middleware generates or reads a correlation ID
2. `asyncLocalStorage.run(context, callback)` creates a "store" that's accessible from any code called within the callback
3. A loader 5 layers deep can call `getCorrelationId()` and get the ID without it being passed as a parameter
4. The response header `x-correlation-id` is set so the client can include it in bug reports

### `server/request-logger.js` — HTTP Logging

```javascript
export function requestLogger(req, res, next) {
  // Skip static assets to reduce noise
  if (req.url.startsWith("/assets/") || req.url.startsWith("/@")) {
    return next();
  }

  const start = Date.now();
  const correlationId = getCorrelationId();

  logger.info({ msg: "incoming request", correlationId, method: req.method, url: req.originalUrl });

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[logLevel]({
      msg: "request completed",
      correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
}
```

**How `res.on("finish")` works:** Express's response object is a Node.js `Writable` stream. The `"finish"` event fires after the response has been fully sent to the client. By recording `Date.now()` before and after, we get accurate request duration.

**Dynamic log levels:** 5xx responses log as `error`, 4xx as `warn`, everything else as `info`. This makes it easy to set up alerts on error-level logs in production.

---

## 6. P0-04 — Nonce-Based CSP & Security Middleware

### What This Task Does

Hardens the application against common web attacks by adding security HTTP headers, CORS policy, rate limiting, and request filtering. The centerpiece is a Content Security Policy (CSP) that uses per-request cryptographic nonces instead of `unsafe-inline`.

### Files Created/Modified

| File                 | Action    | Purpose                                                   |
| -------------------- | --------- | --------------------------------------------------------- |
| `server/security.ts` | Created   | All security middleware in one file                       |
| `server/app.ts`      | Rewritten | Wired security middleware into Express pipeline           |
| `app/root.tsx`       | Modified  | Passes CSP nonce to `<Scripts>` and `<ScrollRestoration>` |

### The Security Middleware Stack

The order of middleware in `server/app.ts` matters:

```typescript
// 1. Generate nonce FIRST (other middleware and React need it)
app.use(nonceMiddleware);

// 2. Set security headers (uses the nonce from step 1)
app.use(helmetMiddleware);

// 3. Permissions-Policy header
app.use(permissionsPolicy);

// 4. CORS (must be before request handlers)
app.use(corsMiddleware);

// 5. Block suspicious requests BEFORE they consume rate limit tokens
app.use(suspiciousRequestBlocker);

// 6. Rate limiting (3 tiers)
app.use(generalLimiter); // All requests: 100/15min
app.use("/api", mutationLimiter); // API mutations: 50/min
app.use("/auth", authLimiter); // Auth endpoints: 10/min
```

### Content Security Policy (CSP) — In Depth

CSP is an HTTP header that tells the browser which resources are allowed to load. Without it, an attacker who finds an XSS vulnerability can inject `<script>` tags that execute arbitrary code.

**The problem with `unsafe-inline`:** Many apps use `script-src 'unsafe-inline'` which allows ANY inline script — including attacker-injected ones. This makes CSP essentially useless.

**The nonce solution:** Generate a random value per request, include it in the CSP header AND on legitimate `<script>` tags. The browser only executes scripts with a matching nonce. An attacker can't guess the nonce because it changes on every request.

**Step 1: Generate a nonce**

```typescript
export function nonceMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
  next();
}
```

`crypto.randomBytes(16)` produces 16 cryptographically random bytes (128 bits of entropy). `.toString("base64")` encodes them as a URL-safe string like `"a3F2Kx9mPqR+bN4w"`.

**Step 2: Include nonce in CSP header**

```typescript
export function helmetMiddleware(req: Request, res: Response, next: NextFunction) {
  const nonce = res.locals.cspNonce as string;

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Only load from same origin
        scriptSrc: ["'self'", `'nonce-${nonce}'`], // Scripts: same origin + matching nonce
        styleSrc: ["'self'", `'nonce-${nonce}'`, "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:"], // Images: same origin + data URIs
        connectSrc: ["'self'"], // XHR/fetch: same origin only
        fontSrc: ["'self'", "https://fonts.gstatic.com"], // Fonts: same origin + Google Fonts
        objectSrc: ["'none'"], // Block <object>, <embed>, <applet>
        frameAncestors: ["'none'"], // Block framing (clickjacking protection)
        baseUri: ["'self'"], // Block <base> tag manipulation
        formAction: ["'self'"], // Forms can only submit to same origin
      },
    },
  })(req, res, next);
}
```

The resulting HTTP header looks like:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-a3F2Kx9mPqR+bN4w'; style-src 'self' 'nonce-a3F2Kx9mPqR+bN4w' https://fonts.googleapis.com; ...
```

**Why call `helmet()` inside a middleware?** Normally `helmet()` is called once and returns a middleware function. But since the nonce changes per request, we must call `helmet()` per request to generate a new CSP header each time.

**Step 3: Pass nonce to React**

The nonce must be added to the `<script>` tags that React Router injects. This happens through the `AppLoadContext`:

```typescript
// server/app.ts — passes nonce from Express to React Router
app.use(
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
    getLoadContext(_req, res) {
      return { cspNonce: res.locals.cspNonce as string };
    },
  }),
);
```

```typescript
// app/root.tsx — root loader makes nonce available to components
export function loader({ context }: Route.LoaderArgs) {
  return { cspNonce: context.cspNonce };
}
```

```tsx
// app/root.tsx — Layout component adds nonce to script tags
function useNonce(): string | undefined {
  try {
    const data = useRouteLoaderData("root") as { cspNonce?: string } | undefined;
    return data?.cspNonce;
  } catch {
    return undefined; // Safe fallback during error boundary rendering
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const nonce = useNonce();
  return (
    <html lang="en">
      <head>...</head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}
```

React Router adds `nonce="a3F2Kx9mPqR+bN4w"` to every `<script>` tag it renders, matching the CSP header.

### CORS Configuration

```typescript
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

export const corsMiddleware = cors({
  origin: allowedOrigins, // Only these origins can make cross-origin requests
  credentials: true, // Allow cookies in cross-origin requests
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-API-Key"],
});
```

### Rate Limiting — Three Tiers

| Limiter           | Scope            | Window | Max Requests | Purpose                            |
| ----------------- | ---------------- | ------ | ------------ | ---------------------------------- |
| `generalLimiter`  | All routes       | 15 min | 100          | Prevent abuse of any endpoint      |
| `mutationLimiter` | `/api` (non-GET) | 1 min  | 50           | Protect data-modifying operations  |
| `authLimiter`     | `/auth`          | 1 min  | 10           | Prevent brute-force login attempts |

The mutation limiter uses `skip` to ignore GET/HEAD/OPTIONS requests:

```typescript
skip: (req) => req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS";
```

### Suspicious Request Blocking

Blocks requests that match known attack patterns:

```typescript
// Missing User-Agent or Accept headers (likely automated scanner)
if (!req.headers["user-agent"] || !req.headers["accept"]) → 403

// Known vulnerability scanner user agents
if (/sqlmap|nikto|nessus|openvas/i.test(userAgent)) → 403

// Path traversal attempts (../../etc/passwd)
if (/\.\.\//.test(path)) → 403

// Reflected XSS attempts (<script> in URL)
if (/<script/i.test(url)) → 403

// SQL injection attempts (UNION SELECT in URL)
if (/union\s+select/i.test(url)) → 403
```

### Other Security Headers

```typescript
// Permissions-Policy: restrict browser features
"camera=(self), microphone=(), geolocation=(), payment=()"

// HSTS: force HTTPS for 1 year, include subdomains, allow preload list
strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true, preload: true }

// Referrer-Policy: send full URL to same origin, only origin to cross-origin
referrerPolicy: { policy: "strict-origin-when-cross-origin" }
```

---

## 7. P0-05 — Testing Framework

### What This Task Does

Sets up the complete testing pyramid: unit tests (Vitest), integration tests (Vitest + real database), and end-to-end tests (Playwright). Includes mock servers, test factories, and initial test suites.

### Files Created/Modified

| File                                      | Action   | Purpose                                               |
| ----------------------------------------- | -------- | ----------------------------------------------------- |
| `vitest.config.ts`                        | Created  | Unit test configuration                               |
| `vitest.integration.config.ts`            | Created  | Integration test configuration (separate DB)          |
| `playwright.config.ts`                    | Created  | E2E test configuration with 3 browser projects        |
| `tests/setup/unit-setup.ts`               | Created  | Starts MSW mock server before unit tests              |
| `tests/setup/integration-setup.ts`        | Created  | Creates Prisma client, truncates tables between tests |
| `tests/mocks/handlers.ts`                 | Created  | MSW request handlers for Azure services               |
| `tests/mocks/server.ts`                   | Created  | MSW server instance                                   |
| `tests/factories/index.ts`                | Created  | Factory functions for building test data              |
| `tests/e2e/smoke.spec.ts`                 | Created  | Basic health check and page load tests                |
| `app/lib/__tests__/env.server.test.ts`    | Created  | Unit tests for environment validation                 |
| `app/utils/__tests__/soft-delete.test.ts` | Created  | Unit tests for soft-delete utilities                  |
| `package.json`                            | Modified | Added test scripts                                    |

### `vitest.config.ts` — Unit Tests

```typescript
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()], // Resolve ~ imports from tsconfig paths
  test: {
    include: ["app/**/*.{test,spec}.{ts,tsx}"], // Tests live next to source code
    exclude: ["node_modules", "build", "tests/e2e", "tests/integration"],
    coverage: {
      provider: "v8", // Use V8's built-in coverage (fast)
      reporter: ["text", "lcov", "json-summary"],
      exclude: ["node_modules", "build", "tests/**", "app/generated/**"],
    },
    setupFiles: ["tests/setup/unit-setup.ts"], // Runs before every test file
  },
});
```

**Why `vite-tsconfig-paths`?** The app uses `~` as a path alias (e.g., `import { prisma } from "~/lib/db.server"`). Vite resolves these during builds, but Vitest needs the plugin to resolve them during testing.

### `tests/setup/unit-setup.ts` — MSW Lifecycle

```typescript
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "../mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers()); // Reset to default handlers between tests
afterAll(() => server.close());
```

**What is MSW (Mock Service Worker)?** It intercepts outgoing HTTP requests at the network level and returns mock responses. Unlike mocking `fetch` directly, MSW works with any HTTP client and catches requests you didn't know your code was making.

### `tests/mocks/handlers.ts` — Mock Azure Services

```typescript
import { http, HttpResponse } from "msw";

const blobStore = new Map<string, ArrayBuffer>(); // In-memory blob storage
export const sentEmails: Array<{ to: string; subject: string; body: string }> = [];

export const handlers = [
  // Azure Blob Storage - Upload
  http.put("https://*.blob.core.windows.net/:container/:blob", async ({ params, request }) => {
    const key = `${params.container}/${params.blob}`;
    blobStore.set(key, await request.arrayBuffer());
    return new HttpResponse(null, { status: 201 });
  }),

  // Azure Blob Storage - Download
  http.get("https://*.blob.core.windows.net/:container/:blob", ({ params }) => {
    const key = `${params.container}/${params.blob}`;
    const data = blobStore.get(key);
    if (!data) return new HttpResponse(null, { status: 404 });
    return new HttpResponse(data, { status: 200 });
  }),

  // Azure Communication Services - Send Email
  http.post("https://*.communication.azure.com/emails\\:send*", async ({ request }) => {
    const body = await request.json();
    sentEmails.push({
      to: body.recipients?.to?.[0]?.address ?? "",
      subject: body.content?.subject ?? "",
      body: body.content?.html ?? "",
    });
    return HttpResponse.json({ id: "mock-email-id", status: "Succeeded" });
  }),
];
```

**Why mock external services?** Unit tests must be fast, reliable, and not depend on external infrastructure. Mocking Azure services means tests run in milliseconds without network access, and the `sentEmails` array lets you assert that the right emails would have been sent.

### `tests/factories/index.ts` — Test Data Builders

```typescript
let counter = 0;
function unique() { return ++counter; }

export function buildTenant(overrides?: Record<string, unknown>) {
  const n = unique();
  return {
    name: `Test Org ${n}`,
    email: `org${n}@test.com`,
    phone: `+1-555-000-${String(n).padStart(4, "0")}`,
    subscriptionPlan: "PROFESSIONAL",
    ...overrides,
  };
}

export function buildUser(overrides?: Record<string, unknown>) { ... }
export function buildEvent(overrides?: Record<string, unknown>) { ... }
export async function seedFullScenario(prisma: PrismaClient) { ... }
```

**The factory pattern:** Each `build*` function returns a valid object with unique values (via the counter). The `overrides` parameter lets tests customize specific fields:

```typescript
// Create a user with a specific email
const user = buildUser({ email: "admin@test.com" });

// Create a locked user
const locked = buildUser({ status: "LOCKED" });
```

`seedFullScenario()` creates a complete tenant → user → event chain in the database for integration tests.

### `tests/setup/integration-setup.ts` — Database Cleanup

```typescript
import { PrismaClient } from "../../app/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
export const prisma = new PrismaClient({ adapter });

beforeEach(async () => {
  await prisma.$transaction([
    prisma.session.deleteMany(), // Delete children first
    prisma.password.deleteMany(), // (foreign key constraints)
    prisma.event.deleteMany(),
    prisma.user.deleteMany(),
    prisma.tenant.deleteMany(), // Delete parent last
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

**Why truncate in a specific order?** PostgreSQL enforces foreign key constraints. You can't delete a Tenant if Users reference it. The order goes from leaf models (Session, Password) to root models (Tenant). Using `$transaction` ensures all deletes happen atomically.

### `playwright.config.ts` — E2E Tests

```typescript
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0, // Retry once in CI (flaky protection)
  workers: process.env.CI ? 1 : undefined, // Single worker in CI for stability

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry", // Capture full trace on retry (for debugging)
    screenshot: "only-on-failure", // Screenshot on failure (for debugging)
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    { name: "smoke", use: { ...devices["Desktop Chrome"] }, testMatch: /smoke\.spec\.ts/ },
  ],

  webServer: {
    command: "npm run dev", // Playwright starts the dev server automatically
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI, // In dev, reuse running server
  },
});
```

**Three projects:** `chromium` runs all tests on desktop Chrome, `mobile-safari` runs all tests simulating an iPhone 13 (viewport, user agent, touch events), `smoke` runs only `smoke.spec.ts` on desktop Chrome for quick sanity checks.

### `tests/e2e/smoke.spec.ts` — Smoke Tests

```typescript
test("health check returns 200", async ({ request }) => {
  const response = await request.get("/up");
  expect(response.status()).toBe(200);
  expect(await response.text()).toBe("OK");
});

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/React Router/);
});
```

### NPM Scripts

```json
{
  "test": "vitest run", // Unit tests (single run)
  "test:watch": "vitest", // Unit tests (watch mode)
  "test:coverage": "vitest run --coverage", // Unit tests + coverage report
  "test:integration": "vitest run --config vitest.integration.config.ts",
  "test:e2e": "playwright test", // All E2E tests
  "test:e2e:ui": "playwright test --ui" // E2E with interactive UI
}
```

---

## 8. P0-06 — Containerization

### What This Task Does

Creates a production-ready Docker image and a `docker-compose.yml` that provides the infrastructure services (PostgreSQL, Azure Blob Storage emulator, email server) needed for local development.

### Files Created/Modified

| File                 | Action    | Purpose                                               |
| -------------------- | --------- | ----------------------------------------------------- |
| `Dockerfile`         | Rewritten | 4-stage multi-stage build                             |
| `.dockerignore`      | Expanded  | Exclude unnecessary files from Docker context         |
| `docker-compose.yml` | Rewritten | Infrastructure services only (no app container)       |
| `package.json`       | Modified  | Added docker:up, docker:down, docker:db:reset scripts |

### `Dockerfile` — Four-Stage Build

```dockerfile
# ─── Stage 1: Base ────────────────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache dumb-init curl && apk upgrade --no-cache
WORKDIR /app
```

**Why Alpine?** `node:22-alpine` is ~50MB vs ~350MB for `node:22`. Alpine Linux uses musl libc instead of glibc, which means smaller images but occasionally requires platform-specific npm packages.

**Why Node 22?** Prisma 7 requires Node.js `^20.19 || ^22.12 || >=24.0`. Node 22 is the current LTS (Long-Term Support) release with the best ecosystem compatibility.

**Why `dumb-init`?** Node.js doesn't handle Unix signals properly when running as PID 1 in a container. `dumb-init` acts as an init process that forwards signals (SIGTERM, SIGINT) to Node.js so the app can shut down gracefully.

```dockerfile
# ─── Stage 2: Dependencies (production only) ─────────────
FROM base AS deps
COPY package.json prisma.config.ts ./
COPY prisma/ ./prisma/
RUN npm install --omit=dev --ignore-scripts && \
    npx prisma generate
```

**Why `--omit=dev`?** Production images don't need devDependencies (Vitest, Playwright, etc.). This makes the final image significantly smaller.

**No more `DATABASE_URL` placeholder:** In Prisma 6, the datasource URL was defined in `schema.prisma` via `url = env("DATABASE_URL")`, so `prisma generate` required the variable to be set even though it never connects. Prisma 7 moved the URL to `prisma.config.ts` and `prisma generate` no longer needs it.

**Why no `package-lock.json`?** The lock file from macOS doesn't include Linux platform-specific packages (like `@rollup/rollup-linux-arm64-musl`). Using `npm install` instead of `npm ci` lets npm resolve the correct platform dependencies inside the container.

```dockerfile
# ─── Stage 3: Build ───────────────────────────────────────
FROM base AS build
COPY package.json ./
RUN npm install          # All deps including devDependencies (needed for build)
COPY . .
RUN npx prisma generate && npm run build
```

This stage installs ALL dependencies (including Vite, TypeScript, etc.), copies source code, and runs the production build.

```dockerfile
# ─── Stage 4: Production ─────────────────────────────────
FROM base AS production
ENV NODE_ENV=production PORT=8080

COPY --from=deps /app/node_modules ./node_modules     # Prod-only deps
COPY --from=build /app/build ./build                   # Compiled app
COPY --from=build /app/package.json ./
COPY --from=build /app/server.js ./
COPY --from=build /app/server/ ./server/
COPY --from=build /app/prisma/ ./prisma/

USER node                  # Run as non-root (security best practice)
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/up || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

**The multi-stage advantage:** The final image only contains Stage 1 (base) + production node_modules + built application. Build tools, source code, and devDependencies are discarded. The image is as small as possible.

### `docker-compose.yml` — Infrastructure Services

```yaml
services:
  db: # Development database
    image: postgres:16-alpine
    ports: ["5434:5432"] # Host port 5434 (avoids conflicts with local postgres)
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: accreditation
    volumes:
      - pgdata:/var/lib/postgresql/data # Persist data across restarts
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]

  db-test: # Test database (ephemeral)
    image: postgres:16-alpine
    ports: ["5433:5432"]
    environment:
      POSTGRES_DB: accreditation_test
    tmpfs:
      - /var/lib/postgresql/data # RAM disk — fast, data lost on stop

  storage: # Azure Blob Storage emulator
    image: mcr.microsoft.com/azure-storage/azurite:latest
    ports: ["10000:10000", "10001:10001", "10002:10002"]

  mailpit: # Email testing server
    image: axllent/mailpit:latest
    ports:
      - "8025:8025" # Web UI (view sent emails in browser)
      - "1025:1025" # SMTP port (app sends emails here)
```

**Why no app service?** Running the app in a container during development means losing Vite's fast HMR and dealing with volume mount issues. The app runs directly on the host (`npm run dev`) and connects to containerized infrastructure.

**Why `tmpfs` for db-test?** Integration tests need a clean database before each test run. A RAM-backed filesystem makes writes instant and data is automatically discarded when the container stops. No stale data between test runs.

**Mailpit** provides a web UI at http://localhost:8025 where you can see every email the app sends during development. No emails actually leave the machine.

---

## 9. P0-08 — Error Tracking (Sentry)

### What This Task Does

Integrates Sentry for automatic error capture on both server and client. All exports gracefully no-op when `SENTRY_DSN` is empty, so Sentry is completely optional.

### Files Created/Modified

| File                       | Action   | Purpose                                                |
| -------------------------- | -------- | ------------------------------------------------------ |
| `server/sentry.js`         | Created  | Server-side Sentry init (plain JS for server.js)       |
| `app/lib/sentry.server.ts` | Created  | Server-side Sentry for app code (loaders/actions)      |
| `app/lib/sentry.client.ts` | Created  | Client-side Sentry (browser)                           |
| `app/root.tsx`             | Modified | Passes DSN to client, captures errors in ErrorBoundary |
| `server.js`                | Modified | Imports sentry.js at startup, captures SSR errors      |
| `package.json`             | Modified | Added @sentry/node and @sentry/browser                 |

### How Sentry Works Across Server and Client

```
┌─────────────────────────────────────────────────────────┐
│                    Server (Node.js)                      │
│                                                          │
│  server.js                                               │
│    └── import "./server/sentry.js"  ← Initializes early  │
│    └── catch (error) { captureException(error) }         │
│                                                          │
│  Loaders / Actions                                       │
│    └── import from "~/lib/sentry.server"                 │
│    └── captureException(error, { tenantId, userId })     │
│                                                          │
│  Root Loader                                             │
│    └── Returns { sentryDsn: process.env.SENTRY_DSN }    │
│                  ↓ (sent to browser via HTML)            │
├─────────────────────────────────────────────────────────┤
│                    Client (Browser)                       │
│                                                          │
│  root.tsx App component                                  │
│    └── useEffect → initSentryClient(sentryDsn)          │
│                                                          │
│  root.tsx ErrorBoundary                                  │
│    └── useEffect → captureClientException(error)         │
│                                                          │
│  Any component                                           │
│    └── import from "~/lib/sentry.client"                 │
│    └── captureException(error)                           │
└─────────────────────────────────────────────────────────┘
```

### `server/sentry.js` — Server Init

```javascript
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    release: process.env.APP_VERSION || "dev",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,

    beforeSend(event) {
      // Strip sensitive headers before sending to Sentry's servers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },

    ignoreErrors: [
      "AbortError", // User cancelled a fetch
      "Response.redirect", // React Router redirects (not real errors)
      /Navigation cancelled/, // Client-side navigation
      /Navigating to/,
    ],
  });
} else {
  // No DSN = no Sentry. The app runs fine without it.
}

export function captureException(error, context) {
  if (!dsn) return; // No-op when disabled

  Sentry.withScope((scope) => {
    if (context?.correlationId) scope.setTag("correlationId", String(context.correlationId));
    if (context?.tenantId) scope.setTag("tenantId", String(context.tenantId));
    if (context?.userId) scope.setUser({ id: String(context.userId) });
    Sentry.captureException(error);
  });
}
```

**`beforeSend`:** Every event passes through this hook before leaving the server. We strip `authorization` and `cookie` headers to prevent tokens and session IDs from being stored in Sentry's cloud.

**`ignoreErrors`:** These are expected errors that would create noise in the dashboard. `AbortError` happens when users navigate away mid-request. React Router redirects throw Response objects — they're control flow, not bugs.

**`withScope`:** Creates an isolated scope for this one event. Tags like `correlationId` and `tenantId` become searchable/filterable in Sentry's UI. This is critical for multi-tenant apps — you can filter errors by tenant to see which organizations are affected.

### `app/lib/sentry.client.ts` — Browser Init

The client SDK can't initialize immediately because the DSN is stored in an environment variable on the server. The root loader sends it to the browser:

```typescript
// root.tsx loader
export function loader({ context }: Route.LoaderArgs) {
  return {
    cspNonce: context.cspNonce,
    sentryDsn: process.env.SENTRY_DSN || "",  // Sent to browser
  };
}

// root.tsx App component
export default function App() {
  const data = useRouteLoaderData("root");

  useEffect(() => {
    if (data?.sentryDsn) {
      initSentryClient(data.sentryDsn);  // Initialize Sentry in the browser
    }
  }, [data?.sentryDsn]);

  return <Outlet />;
}
```

### Error Boundary Integration

```tsx
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  useEffect(() => {
    // Only report unexpected errors (not 404s or redirects)
    if (error && !(error instanceof Response) && !isRouteErrorResponse(error)) {
      captureClientException(error);
    }
  }, [error]);

  // ... render error UI
}
```

React Router's `ErrorBoundary` catches rendering errors, loader errors, and action errors. We report them to Sentry but skip `Response` objects (which represent intentional HTTP error responses like 404s).

---

## 10. P0-09 — Missing Database Indexes

### What This Task Does

Adds database indexes that Prisma doesn't create automatically, ensuring common queries use index scans instead of sequential table scans.

### Files Created/Modified

| File                                                    | Action   | Purpose                          |
| ------------------------------------------------------- | -------- | -------------------------------- |
| `prisma/schema.prisma`                                  | Modified | Added `@@index` declarations     |
| `prisma/migrations/20260214173648_add_missing_indexes/` | Created  | SQL migration                    |
| `scripts/verify-indexes.ts`                             | Created  | Script to verify indexes exist   |
| `package.json`                                          | Modified | Added `db:verify-indexes` script |

### Indexes Added

```prisma
model User {
  // ...
  @@index([deletedAt])   // Filter active users (WHERE deletedAt IS NULL)
  @@index([tenantId])    // List users by tenant
}

model Session {
  // Changed from single-column to composite index
  @@index([userId, expirationDate])  // Find active sessions for a user
}

model Event {
  @@index([tenantId, status])  // List events by tenant and status
  @@index([deletedAt])         // Filter active events
}

model Tenant {
  @@index([name, email])  // Search tenants by name or email
}
```

### Why These Indexes Matter

**Without `@@index([tenantId])` on User:**

```sql
-- This query scans EVERY row in the User table
SELECT * FROM "User" WHERE "tenantId" = 'abc123';
-- On a table with 1 million users across 100 tenants:
-- Sequential Scan: reads all 1,000,000 rows → ~200ms
```

**With `@@index([tenantId])` on User:**

```sql
-- This query uses the B-tree index to jump directly to matching rows
SELECT * FROM "User" WHERE "tenantId" = 'abc123';
-- Index Scan: reads only ~10,000 rows for that tenant → ~2ms
```

**Composite index `[userId, expirationDate]` on Session:**

```sql
-- Common query: find active sessions for a user
SELECT * FROM "Session"
WHERE "userId" = 'user123' AND "expirationDate" > NOW();
-- The composite index satisfies BOTH conditions in a single index lookup
```

### `scripts/verify-indexes.ts` — Regression Prevention

```typescript
const expectedIndexes: Record<string, string[][]> = {
  Tenant: [["name", "email"]],
  User: [["deletedAt"], ["tenantId"]],
  Session: [["userId", "expirationDate"]],
  Event: [["tenantId", "status"], ["deletedAt"]],
};

// Queries pg_indexes catalog to verify each expected index exists
// Exits with code 1 if any are missing
```

Run with: `npm run db:verify-indexes`

---

## 11. P0-10 — User Soft Delete

### What This Task Does

Instead of permanently deleting users (which breaks referential integrity and loses audit trails), soft delete sets a `deletedAt` timestamp. The user's data is preserved but hidden from normal queries.

### Files Created/Modified

| File                                                 | Action    | Purpose                                           |
| ---------------------------------------------------- | --------- | ------------------------------------------------- |
| `app/lib/db.server.ts`                               | Rewritten | Added Prisma client extensions for auto-filtering |
| `app/utils/soft-delete.server.ts`                    | Created   | `softDeleteUser`, `restoreUser`, `isDeleted`      |
| `app/utils/__tests__/soft-delete.test.ts`            | Created   | Unit tests                                        |
| `prisma/migrations/20260214200000_.../migration.sql` | Created   | Partial indexes                                   |
| `prisma/schema.prisma`                               | Modified  | Added `deletedAt DateTime?` to User and Event     |

### Schema Changes

```prisma
model User {
  // ...
  deletedAt DateTime?   // null = active, non-null = soft-deleted
}

model Event {
  // ...
  deletedAt DateTime?
}
```

### Prisma Client Extensions — Automatic Filtering

The core idea: every `findMany`, `findFirst`, and `count` query on User and Event automatically adds `WHERE deletedAt IS NULL` unless the caller explicitly opts out.

```typescript
function withSoftDelete(client: PrismaClient) {
  return client.$extends({
    query: {
      user: {
        async findMany({ args, query }) {
          // Check if the caller explicitly wants deleted records
          const includeDeleted = (args as any).includeDeleted === true;
          delete (args as any).includeDeleted;

          // Add the filter unless opted out
          if (!includeDeleted) {
            args.where = { ...args.where, deletedAt: null };
          }

          return query(args); // Execute the original query with modified args
        },
        // Same pattern for findFirst and count
      },
      event: {
        // Same pattern
      },
    },
  });
}
```

**Usage in application code:**

```typescript
// Normal query — automatically excludes soft-deleted users
const users = await prisma.user.findMany({ where: { tenantId: "abc" } });

// Admin view — explicitly include deleted users
const allUsers = await prisma.user.findMany({
  where: { tenantId: "abc" },
  includeDeleted: true,
} as any);
```

### Soft Delete Utilities

```typescript
// app/utils/soft-delete.server.ts

export async function softDeleteUser(userId: string, deletedBy?: string): Promise<void> {
  // Set the deletion timestamp
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });

  // CRITICAL: Invalidate all sessions so the user is logged out everywhere
  await prisma.session.deleteMany({
    where: { userId },
  });

  logger.info({ userId, deletedBy }, "User soft-deleted, sessions invalidated");
}

export async function restoreUser(userId: string, restoredBy?: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: null },
  });
  logger.info({ userId, restoredBy }, "User restored");
}

export function isDeleted(entity: { deletedAt: Date | null }): boolean {
  return entity.deletedAt !== null;
}
```

### Partial Indexes

```sql
-- Only index active (non-deleted) users
CREATE INDEX "idx_user_active" ON "User" ("id") WHERE "deletedAt" IS NULL;

-- Only index active (non-deleted) events
CREATE INDEX "idx_event_active" ON "Event" ("id") WHERE "deletedAt" IS NULL;
```

**Why partial indexes?** Most queries only care about active records. A partial index is smaller (doesn't include deleted rows) and faster to scan. PostgreSQL's query planner automatically uses it when the query includes `WHERE deletedAt IS NULL`.

---

## 12. Prisma 7 Upgrade

### What This Upgrade Does

Upgrades from Prisma 6.19.2 to Prisma 7.4.0. Prisma 7 is a major release that removes the Rust query engine and replaces it with pure JavaScript driver adapters. This means faster cold starts, simpler deployments, and no more platform-specific binary issues.

### Breaking Changes That Affected This Project

1. **`PrismaClient` now requires a driver adapter** — can no longer connect using just a URL string
2. **`datasource.url` removed from `schema.prisma`** — connection URL is configured only in `prisma.config.ts`
3. **`prisma generate` no longer needs `DATABASE_URL`** — the URL is not read from the schema anymore
4. **Node.js version requirement** — must be `^20.19 || ^22.12 || >=24.0` (Node 23 is not supported)

### Files Modified

| File                               | Change                                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                     | Upgraded `prisma` and `@prisma/client` to 7.4.0, added `@prisma/adapter-pg`, `pg`, `@types/pg`                             |
| `prisma/schema.prisma`             | Removed `url = env("DATABASE_URL")` from datasource block                                                                  |
| `app/lib/db.server.ts`             | Added `PrismaPg` adapter to `PrismaClient` constructor                                                                     |
| `prisma/seed.ts`                   | Added `PrismaPg` adapter to `PrismaClient` constructor                                                                     |
| `tests/setup/integration-setup.ts` | Added `PrismaPg` adapter to `PrismaClient` constructor                                                                     |
| `scripts/verify-indexes.ts`        | Added `PrismaPg` adapter to `PrismaClient` constructor                                                                     |
| `Dockerfile`                       | Changed base image from `node:20-alpine` to `node:22-alpine`, removed dummy `DATABASE_URL` from `prisma generate` commands |
| `.node-version`                    | Created — pins Node 22 for `fnm` auto-switching                                                                            |

### Before vs After: Schema

```prisma
# Before (Prisma 6) — URL in schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# After (Prisma 7) — URL only in prisma.config.ts
datasource db {
  provider = "postgresql"
}
```

### Before vs After: PrismaClient

```typescript
// Before (Prisma 6) — reads DATABASE_URL from env automatically
import { PrismaClient } from "../generated/prisma/client.js";
const prisma = new PrismaClient();

// After (Prisma 7) — requires explicit driver adapter
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

### Why Driver Adapters?

In Prisma 6 and earlier, the query engine was a Rust binary that Prisma compiled for each platform (linux-x64, linux-arm64-musl, darwin-arm64, etc.). This caused:

- **Docker build headaches:** The binary compiled on macOS didn't work in Alpine Linux containers
- **Cold start latency:** The Rust binary had to be loaded and initialized
- **Platform mismatches:** Lock files from one OS wouldn't include binaries for another

Prisma 7 replaces the Rust engine with pure JavaScript driver adapters (`@prisma/adapter-pg` uses the `pg` npm package). Benefits:

- **No platform-specific binaries** — works everywhere Node.js runs
- **Faster cold starts** — no Rust binary to load
- **Simpler Docker builds** — no more dummy `DATABASE_URL` for `prisma generate`
- **Direct driver access** — you can configure SSL, connection pooling, and other driver-level options on the adapter

### Node.js Version Change

Prisma 7 requires Node.js `^20.19 || ^22.12 || >=24.0`. The project was on Node 23.11.0 (an odd-numbered, non-LTS release). Switched to Node 22 LTS for:

- Long-term support and stability
- Broad package ecosystem compatibility
- `.node-version` file added so `fnm` auto-switches when entering the project directory

---

## 13. Skipped: P0-07 — CI/CD Pipeline

P0-07 (GitHub Actions CI/CD pipeline) was intentionally skipped. It can be implemented later when the project is ready for automated deployments.

---

## 14. Commit History

### Commit 1: `886971e` — Initial scaffold from create-react-router

- React Router 7 template with Vite + Express
- 21 files, 4,687 insertions

### Commit 2: `cc9d31e` — Project scaffolding (P0-00)

- Prisma schema with 5 models + initial migration
- Health check route, db singleton, seed script
- All project dependencies added
- 14 files, 4,836 insertions

### Commit 3: `2159c70` — P0-01, P0-02, P0-09

- Environment variable validation with Zod
- Husky + lint-staged + commitlint + Prettier
- Database indexes + verification script
- 47 files, 108,091 insertions (includes design docs in modules/)

### Commit 4: `1506b23` — P0-03, P0-04, P0-06

- Pino structured logging + correlation IDs
- Helmet CSP with nonces + CORS + rate limiting
- Docker multi-stage build + docker-compose infrastructure
- 17 files, 876 insertions

### Commit 5: `9370d29` — P0-05, P0-08, P0-10

- Vitest + Playwright + MSW test infrastructure
- Sentry error tracking (server + client)
- Soft delete with Prisma extensions
- 21 files, 1,600 insertions

### Commit 6: (pending) — Prisma 7 upgrade

- Upgraded Prisma 6.19.2 → 7.4.0 with `@prisma/adapter-pg` driver adapter
- Switched Node.js from 23 to 22 LTS (required by Prisma 7)
- Removed `DATABASE_URL` from schema.prisma (now only in prisma.config.ts)
- All PrismaClient instantiations now use `PrismaPg` adapter
- Dockerfile base image changed from `node:20-alpine` to `node:22-alpine`

---

## 15. Complete File Inventory

### Server Entry & Config

| File                       | Purpose                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| `server.js`                | Node.js entry point, loads Vite/production, applies global middleware |
| `server/app.ts`            | Express app with security middleware + React Router handler           |
| `server/logger.js`         | Pino logger (JSON prod, pretty dev)                                   |
| `server/correlation.js`    | AsyncLocalStorage correlation ID middleware                           |
| `server/request-logger.js` | HTTP request/response logging                                         |
| `server/security.ts`       | Helmet CSP, CORS, rate limiting, request blocking                     |
| `server/sentry.js`         | Server-side Sentry initialization                                     |

### App Code (TypeScript, compiled by Vite)

| File                                   | Purpose                                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| `app/root.tsx`                         | Root layout, CSP nonce injection, Sentry client init, ErrorBoundary |
| `app/lib/db.server.ts`                 | Prisma client singleton with soft-delete extensions                 |
| `app/lib/env.server.ts`                | Zod environment variable validation                                 |
| `app/lib/logger.server.ts`             | TypeScript Pino logger for loaders/actions                          |
| `app/lib/sentry.server.ts`             | TypeScript Sentry wrapper for loaders/actions                       |
| `app/lib/sentry.client.ts`             | Browser Sentry initialization                                       |
| `app/middleware/correlation.server.ts` | TypeScript correlation utilities                                    |
| `app/utils/soft-delete.server.ts`      | Soft delete/restore functions                                       |
| `app/routes/up.tsx`                    | Health check endpoint                                               |

### Database

| File                                                    | Purpose                             |
| ------------------------------------------------------- | ----------------------------------- |
| `prisma/schema.prisma`                                  | Database schema (5 models, 2 enums) |
| `prisma.config.ts`                                      | Prisma configuration                |
| `prisma/seed.ts`                                        | Database seeder                     |
| `prisma/migrations/20260214141113_init/`                | Initial schema migration            |
| `prisma/migrations/20260214173648_add_missing_indexes/` | Index migration                     |
| `prisma/migrations/20260214200000_.../`                 | Soft delete partial indexes         |
| `scripts/verify-indexes.ts`                             | Index verification script           |

### Testing

| File                                      | Purpose                         |
| ----------------------------------------- | ------------------------------- |
| `vitest.config.ts`                        | Unit test configuration         |
| `vitest.integration.config.ts`            | Integration test configuration  |
| `playwright.config.ts`                    | E2E test configuration          |
| `tests/setup/unit-setup.ts`               | MSW server lifecycle            |
| `tests/setup/integration-setup.ts`        | Database cleanup between tests  |
| `tests/mocks/handlers.ts`                 | MSW handlers for Azure services |
| `tests/mocks/server.ts`                   | MSW server instance             |
| `tests/factories/index.ts`                | Test data factory functions     |
| `tests/e2e/smoke.spec.ts`                 | Health check + page load tests  |
| `app/lib/__tests__/env.server.test.ts`    | Env validation tests (3 tests)  |
| `app/utils/__tests__/soft-delete.test.ts` | isDeleted tests (3 tests)       |

### DevOps & Config

| File                      | Purpose                                                 |
| ------------------------- | ------------------------------------------------------- |
| `Dockerfile`              | 4-stage production Docker image                         |
| `.dockerignore`           | Files excluded from Docker context                      |
| `docker-compose.yml`      | Infrastructure services (db, db-test, storage, mailpit) |
| `.env.example`            | Documented environment variables                        |
| `.husky/pre-commit`       | Runs lint-staged                                        |
| `.husky/commit-msg`       | Runs commitlint                                         |
| `.lintstagedrc.json`      | lint-staged file patterns and commands                  |
| `commitlint.config.ts`    | Conventional Commits rules                              |
| `.prettierrc.json`        | Prettier formatting config                              |
| `.prettierignore`         | Files excluded from formatting                          |
| `docs/secret-rotation.md` | Secret rotation procedures                              |
| `.node-version`           | Pins Node 22 for fnm auto-switching                     |

---

## 16. Bugs & Gotchas Encountered

### 1. Prisma `seed` Config Location

**Error:** `seed` property doesn't exist on `PrismaConfig` type.

**Root cause:** Prisma 6 moved the `seed` property from the top level into the `migrations` object.

**Fix:**

```typescript
// Before (wrong)
export default defineConfig({
  seed: "npx tsx prisma/seed.ts",
});

// After (correct)
export default defineConfig({
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
```

### 2. Zod v4 Boolean Coercion

**Error:** `ENABLE_2FA=false` was being parsed as `true`.

**Root cause:** `z.coerce.boolean()` uses JavaScript's `Boolean()` constructor. `Boolean("false") === true` because any non-empty string is truthy.

**Fix:** Used `z.preprocess` with explicit string comparison:

```typescript
const booleanString = z.preprocess((v) => {
  if (typeof v === "string") return v === "true" || v === "1";
  return false;
}, z.boolean());
```

### 3. Express Header Type Mismatch

**Error:** `req.headers["x-correlation-id"]` can be `string | string[]` (HTTP allows duplicate headers).

**Fix:** Added Array.isArray check:

```javascript
const rawId = req.headers["x-correlation-id"];
const correlationId = (Array.isArray(rawId) ? rawId[0] : rawId) || crypto.randomUUID();
```

### 4. Docker Lock File Platform Mismatch

**Error:** `npm ci` failed with "Missing: @rollup/rollup-linux-arm64-musl" because the lock file was generated on macOS and didn't include Linux-specific optional dependencies.

**Fix:** Removed `package-lock.json` from Docker `COPY` and used `npm install` instead of `npm ci`.

### 5. Docker Prisma Generate Requires DATABASE_URL (Prisma 6 only)

**Error:** `prisma generate` failed with "Missing required environment variable: DATABASE_URL" during Docker build.

**Fix in Prisma 6:** Added a dummy DATABASE_URL that satisfies the parser without connecting:

```dockerfile
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate
```

**Resolved in Prisma 7:** This issue no longer exists. Prisma 7 moved the datasource URL out of `schema.prisma` into `prisma.config.ts`, and `prisma generate` no longer needs it. The dummy `DATABASE_URL` was removed from the Dockerfile.

### 6. Vitest v4 Removed poolOptions

**Error:** `minForks` and `poolOptions` don't exist on Vitest v4's `InlineConfig` type.

**Root cause:** Vitest v4 removed these configuration options. `forks` is the default pool and concurrency is managed automatically.

**Fix:** Removed the pool-related options entirely.

### 7. Prisma 7 Requires Specific Node.js Versions

**Error:** `npm install prisma@7` failed with "Prisma only supports Node.js versions 20.19+, 22.12+, 24.0+."

**Root cause:** The project was running Node.js v23.11.0, which is an odd-numbered (non-LTS) release that Prisma 7 explicitly excludes.

**Fix:** Switched to Node 22 LTS using `fnm use 22` and added a `.node-version` file to the project root so `fnm` auto-switches when entering the directory.

### 8. Prisma 7 Requires Driver Adapter

**Error:** `new PrismaClient()` with no arguments throws at runtime — Prisma 7 requires either an `adapter` or `accelerateUrl`.

**Root cause:** Prisma 7 removed the built-in Rust query engine. The `PrismaClient` constructor no longer reads `DATABASE_URL` from the environment automatically.

**Fix:** Installed `@prisma/adapter-pg` and `pg`, and updated every `PrismaClient` instantiation:

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

This pattern was applied in 4 files: `app/lib/db.server.ts`, `prisma/seed.ts`, `tests/setup/integration-setup.ts`, and `scripts/verify-indexes.ts`.

---

## 17. Architecture Decisions

### Decision 1: Plain JS for `server/` vs TypeScript for `app/`

**Why:** `server.js` is the Node.js entry point that runs BEFORE Vite starts. It can't import TypeScript files because there's no compiler running yet. The `server/` directory contains plain `.js` files that `server.js` can import directly. The `app/` directory contains TypeScript files that Vite compiles during SSR.

**Implication:** Some code is duplicated (e.g., logger exists in both `server/logger.js` and `app/lib/logger.server.ts`). This is acceptable because:

- The server-side logger handles the startup phase (before Vite)
- The app-side logger handles the SSR phase (loaders, actions)
- They share the same Pino configuration for consistency

### Decision 2: Infrastructure-Only Docker Compose

**Why:** Running the app inside Docker during development sacrifices Vite's instant HMR and creates volume mount performance issues on macOS. The app runs natively on the host and connects to containerized services.

### Decision 3: No Coverage Thresholds (Yet)

**Why:** The project currently has only infrastructure code. Setting 80% thresholds would require writing tests for MSW handlers, Prisma extensions, and other plumbing that will be exercised naturally when feature tests are written. Thresholds will be introduced in a later phase.

### Decision 4: Graceful No-Op Pattern for Sentry

**Why:** Every Sentry function checks `if (!dsn) return` before doing anything. This means:

- Development works without a Sentry account
- Tests don't send errors to Sentry
- Production deploys without Sentry are valid (just no error tracking)
- No `if (sentry.isEnabled)` checks scattered across the codebase

### Decision 5: Prisma Client Extensions for Soft Delete

**Why alternatives were rejected:**

- **Prisma middleware (deprecated):** Prisma is deprecating middleware in favor of extensions
- **Manual WHERE clause:** Developers would forget to add `deletedAt: null`, leading to data leaks
- **Database views:** Would require maintaining parallel views and complicate migrations

**Why extensions work well:** They intercept queries at the ORM level transparently. Application code uses `prisma.user.findMany()` normally, and the extension adds the filter automatically.

### Decision 6: Prisma 7 with `@prisma/adapter-pg` (Driver Adapters)

**Why upgrade from Prisma 6?** Prisma 7 eliminates the Rust query engine binary that caused Docker platform mismatches, slow cold starts, and required dummy `DATABASE_URL` values during `prisma generate`. The pure JavaScript driver adapter (`@prisma/adapter-pg`) works everywhere Node.js runs.

**Why `@prisma/adapter-pg` over other adapters?**

- `@prisma/adapter-pg` uses the well-established `pg` npm package (millions of weekly downloads)
- Direct access to driver-level configuration (SSL, connection pooling, timeouts)
- If the project later needs connection pooling (e.g., PgBouncer or Prisma Accelerate), the adapter pattern makes it a one-line change

### Decision 7: Node 22 LTS

**Why not stay on Node 23?** Node 23 is an odd-numbered release (not LTS), meaning it receives only 6 months of support. Prisma 7, Vitest, and other packages explicitly exclude it. Node 22 is the current LTS release with support until April 2027, offering the best stability and ecosystem compatibility.
