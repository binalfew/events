# P0-08: Error Tracking (Sentry)

| Field                  | Value                                                        |
| ---------------------- | ------------------------------------------------------------ |
| **Task ID**            | P0-08                                                        |
| **Phase**              | 0 — Foundation                                               |
| **Category**           | Observability                                                |
| **Suggested Assignee** | DevOps Engineer                                              |
| **Depends On**         | P0-03 (Structured Logging — correlation IDs)                 |
| **Blocks**             | None                                                         |
| **Estimated Effort**   | 2 days                                                       |
| **Module References**  | [Module 06 §5.5](../modules/06-INFRASTRUCTURE-AND-DEVOPS.md) |

---

## Context

Unhandled exceptions and performance issues in staging and production need to be automatically captured, correlated with request context, and surfaced in a dashboard. Sentry provides error tracking, performance monitoring (APM), and session replay.

---

## Deliverables

### 1. Sentry Server SDK Integration (`app/lib/sentry.server.ts`)

Configure `@sentry/remix` with:

| Setting              | Value                                     |
| -------------------- | ----------------------------------------- |
| DSN                  | From `SENTRY_DSN` environment variable    |
| Environment          | From `NODE_ENV`                           |
| Release              | From `APP_VERSION` env var or git SHA     |
| Traces sample rate   | `0.1` in production, `1.0` in development |
| Profiles sample rate | `0.1` in production                       |

Integrations to enable:

- `prismaIntegration()` — captures database query spans
- `httpIntegration()` — captures outbound HTTP request spans

### 2. Sentry Client SDK Integration

Configure `@sentry/remix` on the client side with:

| Setting        | Value                                              |
| -------------- | -------------------------------------------------- |
| Session replay | 1% normal sessions, 100% on error                  |
| Replay block   | Mask all text, block all media (GDPR-safe default) |

### 3. Sensitive Data Filtering (`beforeSend`)

Implement a `beforeSend` callback that:

- Strips `authorization` and `cookie` headers from request data
- Adds tenant fingerprinting: group errors by `tenantId` when available
- Attaches `correlationId` from the logging context (P0-03) as a tag

### 4. Noise Filtering

Configure ignored errors to prevent alert fatigue:

| Error Pattern             | Reason                          |
| ------------------------- | ------------------------------- |
| `AbortError`              | User navigated away mid-request |
| `Response.redirect`       | Normal redirect flow            |
| Navigation/routing errors | Expected in SPA navigation      |

### 5. Error Boundary Integration

- Add Sentry error boundary to the root React Router error boundary
- Ensure both server-side (loader/action) errors and client-side render errors are captured
- Include user context (userId, tenantId, role) on captured events when available (do NOT include email or name — GDPR)

### 6. Source Maps

- Upload source maps to Sentry during the CI build step (coordinate with P0-07)
- Ensure source maps are NOT served to the browser in production
- Associate source maps with the release version

---

## Acceptance Criteria

- [ ] Sentry is initialized on both server and client when `SENTRY_DSN` is set
- [ ] When `SENTRY_DSN` is not set, the application starts normally without errors (graceful no-op)
- [ ] Throwing an unhandled error in a loader/action appears in the Sentry dashboard within 30 seconds
- [ ] Throwing an unhandled error in a React component appears in the Sentry dashboard
- [ ] Captured events include `correlationId`, `tenantId`, and `environment` tags
- [ ] Captured events do NOT include `authorization` headers, `cookie` headers, user email, or user name
- [ ] `AbortError` and `Response.redirect` errors do not appear in Sentry
- [ ] Source maps are uploaded to Sentry — stack traces in the dashboard show original TypeScript source, not compiled JavaScript
- [ ] Performance traces appear in Sentry with database query spans (via Prisma integration)
- [ ] Session replay captures error sessions at 100% rate in staging
