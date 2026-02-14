# P0-03: Structured Logging (Pino)

| Field                  | Value                                                        |
| ---------------------- | ------------------------------------------------------------ |
| **Task ID**            | P0-03                                                        |
| **Phase**              | 0 — Foundation                                               |
| **Category**           | Observability                                                |
| **Suggested Assignee** | Senior Backend Engineer                                      |
| **Depends On**         | P0-01 (Secret Rotation — `LOG_LEVEL` env var)                |
| **Blocks**             | P0-08 (Sentry)                                               |
| **Estimated Effort**   | 3 days                                                       |
| **Module References**  | [Module 06 §5.5](../modules/06-INFRASTRUCTURE-AND-DEVOPS.md) |

---

## Context

The codebase currently uses `console.log` and/or Morgan for logging, which produces unstructured, unparseable output. Production requires JSON-formatted structured logs with correlation IDs for request tracing across Azure Log Analytics.

---

## Deliverables

### 1. Logger Module (`app/lib/logger.server.ts`)

Implement a Pino-based logger with:

- **Production mode:** JSON output to stdout (consumed by Azure Log Analytics)
- **Development mode:** `pino-pretty` with colorized output, translated timestamps, and custom message format
- **Base fields on every log line:** `service: "accreditation-platform"`, `version` (from `APP_VERSION` env), `environment` (from `NODE_ENV`)
- **Log level** controlled by `LOG_LEVEL` environment variable (default: `info`)
- **ISO 8601 timestamps**

### 2. Sensitive Field Redaction

Configure Pino's `redact` option to mask these paths in all log output:

- `password`, `passwordHash`
- `token`, `authorization`
- `cookie`, `sessionId`
- `req.headers.authorization`, `req.headers.cookie`

### 3. Correlation ID Middleware (`app/middleware/correlation.server.ts`)

- Use Node.js `AsyncLocalStorage` to maintain request-scoped context
- Extract correlation ID from `x-correlation-id` or `x-request-id` request headers, or generate a new `crypto.randomUUID()`
- Store `correlationId`, `tenantId`, `userId`, and `requestPath` in the async context
- Every log line automatically includes these fields from the async context

### 4. Request/Response Logging

- Log every incoming request at `info` level with method, URL, and correlation ID
- Log every response with status code and duration in milliseconds
- Custom serializers for request and response objects (strip headers that are redacted)

### 5. Replace All Existing `console.log` / Morgan Usage

- Remove Morgan middleware if present
- Search and replace all `console.log`, `console.error`, `console.warn` calls with the appropriate `logger.info`, `logger.error`, `logger.warn` calls
- Remove Morgan from dependencies

---

## Acceptance Criteria

- [ ] Zero `console.log`, `console.error`, or `console.warn` calls remain in the codebase (verify with grep)
- [ ] Morgan is removed from dependencies and middleware chain
- [ ] In production mode (`NODE_ENV=production`), every log line is valid JSON parseable by `JSON.parse()`
- [ ] Every log line includes `correlationId` — verify by making a request and confirming the same ID appears in request log and any subsequent operation logs
- [ ] Setting `LOG_LEVEL=debug` produces debug output; setting `LOG_LEVEL=error` suppresses info/warn
- [ ] Sensitive fields (`password`, `authorization` header, `cookie`) are redacted as `[REDACTED]` in log output — verify by triggering a login request and inspecting logs
- [ ] In development mode, logs are human-readable with colors and timestamps (not raw JSON)
- [ ] `x-correlation-id` header in a request is propagated through all logs for that request
