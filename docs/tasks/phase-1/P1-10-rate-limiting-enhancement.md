# P1-10: Rate Limiting Enhancement

| Field                  | Value                                                                       |
| ---------------------- | --------------------------------------------------------------------------- |
| **Task ID**            | P1-10                                                                       |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                                       |
| **Category**           | Security                                                                    |
| **Suggested Assignee** | Senior Backend Engineer                                                     |
| **Depends On**         | P1-01                                                                       |
| **Blocks**             | None                                                                        |
| **Estimated Effort**   | 2 days                                                                      |
| **Module References**  | [Module 05 §Rate Limiting](../../modules/05-SECURITY-AND-ACCESS-CONTROL.md) |

---

## Context

Phase 0 established basic rate limiting with three tiers (general, mutation, auth) using IP-based identification. Phase 1 enhances this with:

1. **User-based rate limiting** — authenticated users are identified by user ID, not just IP (prevents shared-IP false positives in corporate networks)
2. **Route-specific limits** — different limits for different API endpoints
3. **Audit logging** — rate limit violations are logged for security monitoring
4. **Graceful responses** — 429 responses include `Retry-After` and rate limit headers

---

## Deliverables

### 1. Enhanced Key Generator (`server/security.ts`)

Update the rate limiter key generator to use authenticated user ID when available:

```typescript
function createKeyGenerator() {
  return (req: Request): string => {
    // If user is authenticated, use their ID (from session)
    // This prevents false positives in corporate networks sharing one IP
    const userId = req.session?.userId;
    if (userId) {
      return `user:${userId}`;
    }
    // Fall back to IP for unauthenticated requests
    return req.ip || req.socket.remoteAddress || "unknown";
  };
}
```

### 2. Route-Specific Rate Limits

Add targeted rate limits for API endpoints that are sensitive or expensive:

| Route Pattern                      | Limit      | Window | Rationale                                |
| ---------------------------------- | ---------- | ------ | ---------------------------------------- |
| `POST /api/v1/fields`              | 30 req/min | 60s    | Field creation is admin-only, infrequent |
| `POST /api/v1/participants/search` | 60 req/min | 60s    | Search can be expensive with JSONB       |
| `POST /api/v1/fields/reorder`      | 20 req/min | 60s    | Bulk operation, infrequent               |
| `POST /auth/login`                 | 10 req/min | 60s    | Brute force prevention (existing)        |
| `PUT /api/v1/participants/*`       | 60 req/min | 60s    | Workflow actions (approve/reject)        |
| `POST /api/v1/files`               | 10 req/min | 60s    | File upload (resource-intensive)         |

### 3. Rate Limit Headers

Ensure all rate-limited responses include standard headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1707916800
```

### 4. 429 Response Body

When a rate limit is exceeded:

```json
{
  "error": "TOO_MANY_REQUESTS",
  "message": "Rate limit exceeded. Please retry after 30 seconds.",
  "retryAfter": 30,
  "limit": 100,
  "resetAt": "2026-02-14T12:05:00Z"
}
```

### 5. Audit Logging for Violations

Log rate limit violations to AuditLog for security monitoring:

```typescript
export function createRateLimitAuditLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Hook into the rate limiter's onLimitReached callback
    // Log: userId (if authenticated), IP, endpoint, tier, timestamp
  };
}
```

### 6. Rate Limit Skip for Health Checks

Ensure health check endpoints (`/up`) are not rate limited:

```typescript
skip: (req: Request) => req.path === "/up";
```

### 7. Tests

Write tests for:

- Authenticated users are identified by user ID (not IP)
- Unauthenticated users are identified by IP
- Rate limit headers are present in all responses
- 429 response includes `Retry-After` and structured error body
- Route-specific limits are applied correctly
- Health check endpoint is exempt from rate limiting
- Rate limit violations are logged to AuditLog
- Different users on the same IP get independent rate limit buckets

---

## Acceptance Criteria

- [ ] Authenticated users are rate limited by user ID, not IP
- [ ] Unauthenticated users are rate limited by IP
- [ ] Route-specific rate limits are applied per the table above
- [ ] All responses include `X-RateLimit-*` headers
- [ ] 429 responses include `Retry-After` header and structured JSON body
- [ ] Rate limit violations are recorded in AuditLog
- [ ] Health check (`/up`) is exempt from rate limiting
- [ ] Two authenticated users on the same IP get independent limits
- [ ] `npm run typecheck` passes with zero errors
- [ ] Unit tests cover all rate limiting scenarios
