# P4-01: REST API Layer & API Key Authentication

| Field                  | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **Task ID**            | P4-01                                                      |
| **Phase**              | 4 — Ecosystem & Integrations                               |
| **Category**           | API                                                        |
| **Suggested Assignee** | Senior Backend Developer                                   |
| **Depends On**         | P4-00 (Foundation Models)                                  |
| **Blocks**             | —                                                          |
| **Estimated Effort**   | 5 days                                                     |
| **Module References**  | [Module 07](../../modules/07-API-AND-INTEGRATION-LAYER.md) |

---

## Context

External systems (partner portals, government databases, mobile apps) need programmatic access to the accreditation platform. This task builds a versioned REST API (`/api/v1/`) authenticated via API keys. Each key is tenant-scoped with granular permissions, rate limiting tiers, IP allowlists, and key rotation support. The `ApiKey` model was created in P4-00.

---

## Deliverables

### 1. API Key Service

Create `app/services/api-keys.server.ts`:

```typescript
// Generate a new API key — returns the raw key only once
function createApiKey(
  input: CreateApiKeyInput,
  ctx: TenantContext,
): Promise<{ apiKey: ApiKey; rawKey: string }>;

// List API keys for tenant (raw key never returned)
function listApiKeys(tenantId: string, filters?: ApiKeyFilters): Promise<PaginatedResult<ApiKey>>;

// Get API key by ID
function getApiKey(id: string, tenantId: string): Promise<ApiKey | null>;

// Update API key metadata (name, description, permissions, allowedIps, etc.)
function updateApiKey(id: string, input: UpdateApiKeyInput, ctx: TenantContext): Promise<ApiKey>;

// Revoke an API key
function revokeApiKey(id: string, ctx: TenantContext): Promise<ApiKey>;

// Rotate an API key — creates new key, old key enters grace period
function rotateApiKey(
  id: string,
  gracePeriodHours: number,
  ctx: TenantContext,
): Promise<{ apiKey: ApiKey; rawKey: string }>;

// Validate an API key from request header — returns tenant context
function validateApiKey(rawKey: string): Promise<ApiKeyValidationResult | null>;
```

Key generation:

- Generate 32-byte random key, prefix with `ak_` and 4-char tenant slug: `ak_tnnt_xxxxxxxxxxxxxxxxxxxxxxxx`
- Store only bcrypt hash of key in DB
- Store `keyPrefix` (first 8 chars) for identification in logs
- On rotation, set old key status to `ROTATED` with `rotationGraceEnd`

### 2. API Key Authentication Middleware

Create `server/api-auth.ts`:

```typescript
function apiKeyAuth(req: Request, res: Response, next: NextFunction): void;
```

- Extract key from `X-API-Key` header
- Validate against hashed store using `validateApiKey()`
- Check key status (ACTIVE or ROTATED within grace period)
- Check `expiresAt` for time-bound keys
- Check IP allowlist if configured (`allowedIps`)
- Inject `tenantId`, `permissions`, and `apiKeyId` into request context
- Update `lastUsedAt`, `lastUsedIp`, `usageCount` (debounced, not on every request)
- Return 401 for invalid/expired/revoked keys, 403 for IP not allowed

### 3. Rate Limiting Middleware

Create `server/api-rate-limit.ts`:

```typescript
function apiRateLimit(req: Request, res: Response, next: NextFunction): void;
```

- Sliding window rate limiting per API key
- Tiers: STANDARD (100/min), ELEVATED (500/min), PREMIUM (2000/min), CUSTOM (from `rateLimitCustom`)
- Use in-memory store (Map with TTL) for single-instance; document Redis upgrade path
- Return `429 Too Many Requests` with `Retry-After` and `X-RateLimit-*` headers:
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### 4. REST API Router

Create `server/api-router.ts` — mount at `/api/v1`:

**Event endpoints:**

- `GET /api/v1/events` — list events with filtering, pagination, field selection (`?fields=id,name,startDate`)
- `GET /api/v1/events/:eventId` — get event with optional relation expansion (`?expand=participantTypes,workflows`)
- `POST /api/v1/events` — create event (requires `events:create` permission)
- `PUT /api/v1/events/:eventId` — update event with optimistic locking (`If-Match` header)
- `DELETE /api/v1/events/:eventId` — soft-delete event

**Participant endpoints:**

- `GET /api/v1/events/:eventId/participants` — list participants with filtering, custom field search
- `GET /api/v1/events/:eventId/participants/:id` — get participant with extras
- `POST /api/v1/events/:eventId/participants` — register participant (triggers workflow)
- `PUT /api/v1/events/:eventId/participants/:id` — update participant

**Workflow endpoints:**

- `GET /api/v1/events/:eventId/workflows` — list workflows
- `GET /api/v1/events/:eventId/workflows/:id` — get workflow with steps

### 5. Response Envelope & Serialization

Standardize all API responses:

```typescript
// Success response
{
  "data": T | T[],
  "meta": {
    "page": number,
    "pageSize": number,
    "total": number,
    "totalPages": number
  }
}

// Error response
{
  "error": {
    "code": string,        // machine-readable: "VALIDATION_ERROR", "NOT_FOUND", etc.
    "message": string,     // human-readable description
    "details": object[]    // field-level errors for validation
  }
}
```

- Field selection: `?fields=id,name,status` limits response fields
- Relation expansion: `?expand=participantTypes` includes related records
- Sorting: `?sort=createdAt:desc`
- Pagination: `?page=1&pageSize=20` (max 100)

### 6. API Permission Checking

Create `app/services/api-permission.server.ts`:

```typescript
function checkApiPermission(apiKeyPermissions: string[], requiredPermission: string): boolean;
```

Permission format: `resource:action` (e.g., `events:read`, `participants:write`).

Map HTTP methods to actions:

- GET → `resource:read`
- POST → `resource:create`
- PUT/PATCH → `resource:update`
- DELETE → `resource:delete`

### 7. API Key Management UI

Create routes and components:

- `app/routes/events.$eventId.settings.api-keys.tsx` — API key list page
- `app/components/api-keys/api-key-list.tsx` — table with name, prefix, status, last used, rate limit tier
- `app/components/api-keys/create-api-key-dialog.tsx` — creation form (name, description, permissions checkboxes, rate limit tier, expiry, IP allowlist)
- `app/components/api-keys/api-key-detail.tsx` — view/edit key details, usage stats, rotation
- Show raw key **only once** after creation in a copyable alert
- Revoke confirmation dialog

### 8. Feature Flag Gate

All REST API features gated behind `FF_REST_API`:

- API router returns 404 when disabled
- API key management UI hidden in settings navigation

---

## Acceptance Criteria

- [ ] API keys generated with `ak_` prefix, bcrypt-hashed, raw key shown only once
- [ ] `X-API-Key` header authenticates requests and resolves tenant context
- [ ] Rate limiting enforces tier-based limits with proper `429` responses and headers
- [ ] IP allowlist blocks requests from non-allowed IPs with `403`
- [ ] Key rotation creates new key, old key honored during grace period
- [ ] REST endpoints support field selection, relation expansion, pagination, sorting
- [ ] Optimistic locking via `If-Match` / `ETag` headers prevents stale writes
- [ ] Response envelope consistent across all endpoints (data/meta/error)
- [ ] API key management UI supports create, view, revoke, rotate
- [ ] Permission checking enforces `resource:action` granularity
- [ ] Feature flag `FF_REST_API` gates all functionality
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for key validation, rate limiting, permission checking (≥10 test cases)
