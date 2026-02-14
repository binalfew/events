# P0-04: Nonce-Based CSP & Security Middleware

| Field                  | Value                                                          |
| ---------------------- | -------------------------------------------------------------- |
| **Task ID**            | P0-04                                                          |
| **Phase**              | 0 — Foundation                                                 |
| **Category**           | Security                                                       |
| **Suggested Assignee** | DevOps Engineer                                                |
| **Depends On**         | P0-01 (Secret Rotation — `CORS_ORIGINS` env var)               |
| **Blocks**             | None                                                           |
| **Estimated Effort**   | 3 days                                                         |
| **Module References**  | [Module 05 §2.4](../modules/05-SECURITY-AND-ACCESS-CONTROL.md) |

---

## Context

The application currently uses `unsafe-inline` in its Content Security Policy, which allows inline script injection (XSS). This must be replaced with per-request cryptographic nonces. Additionally, the full Express security middleware stack must be properly configured.

---

## Deliverables

### 1. Nonce Generation & Helmet Configuration

Update `server.ts` to generate a unique nonce per request and configure Helmet:

- Generate a `crypto.randomBytes(16).toString('base64')` nonce per request
- Store it in `res.locals.cspNonce` for use in SSR templates
- Configure Helmet with the following CSP directives:

| Directive         | Value                                         |
| ----------------- | --------------------------------------------- |
| `default-src`     | `'self'`                                      |
| `script-src`      | `'self'`, `'nonce-{random}'`                  |
| `style-src`       | `'self'`, `'nonce-{random}'`                  |
| `img-src`         | `'self'`, `data:`, `blob:`, Azure Storage URL |
| `connect-src`     | `'self'`                                      |
| `font-src`        | `'self'`                                      |
| `object-src`      | `'none'`                                      |
| `frame-ancestors` | `'none'`                                      |
| `base-uri`        | `'self'`                                      |
| `form-action`     | `'self'`                                      |

### 2. Additional Security Headers

Configure via Helmet:

| Header                      | Value                                                      |
| --------------------------- | ---------------------------------------------------------- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload`             |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                          |
| `X-Content-Type-Options`    | `nosniff`                                                  |
| `X-Frame-Options`           | `DENY`                                                     |
| `Permissions-Policy`        | `camera=(self), microphone=(), geolocation=(), payment=()` |

### 3. CORS Configuration

- Read allowed origins from `CORS_ORIGINS` environment variable (comma-separated)
- Default to `http://localhost:3000` in development
- Enable `credentials: true`
- Allow methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Allow headers: `Content-Type`, `X-CSRF-Token`, `X-API-Key`

### 4. Rate Limiting (3-Tier)

| Tier      | Path               | Max Requests | Window     |
| --------- | ------------------ | ------------ | ---------- |
| General   | `*`                | 100          | 60 seconds |
| Mutations | `/api/*` (non-GET) | 50           | 60 seconds |
| Auth      | `/auth/*`          | 10           | 60 seconds |

Use `express-rate-limit`. Key by `req.ip`. Return standard headers (`RateLimit-*`).

### 5. Suspicious Request Blocking

Implement middleware that blocks and logs requests matching:

- Missing `User-Agent` or `Accept` headers
- Scanner user agents: `sqlmap`, `nikto`, `nessus`, `openvas`
- Path traversal patterns: `../`
- Reflected XSS patterns: `<script`
- SQL injection patterns: `union select`

Log blocked requests as `SUSPICIOUS_REQUEST` audit events.

### 6. SSR Nonce Injection

- Pass the nonce from `res.locals.cspNonce` into the React Router SSR handler
- Ensure all inline `<script>` and `<style>` tags in the server-rendered HTML include `nonce="{value}"`
- Verify that Vite's development mode HMR still works (may need `ws://localhost:*` in `connect-src` for dev)

### 7. Environment-Specific CSP Overrides

| Environment | `img-src` Addition     | `connect-src` Addition        |
| ----------- | ---------------------- | ----------------------------- |
| Development | `localhost:*`          | `ws://localhost:*` (Vite HMR) |
| Staging     | Staging storage URL    | Staging API URL               |
| Production  | Production storage URL | —                             |

---

## Acceptance Criteria

- [ ] `curl -I https://<app-url>` shows `Content-Security-Policy` header with `nonce-` directives and NO `unsafe-inline`
- [ ] `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers are all present in the response
- [ ] All inline scripts and styles in server-rendered HTML have a matching `nonce` attribute
- [ ] The application renders correctly in the browser with the new CSP (no console CSP violation errors)
- [ ] Vite HMR works in development mode without CSP errors
- [ ] Sending 101 requests in 60 seconds from the same IP returns `429 Too Many Requests`
- [ ] Sending a request with `User-Agent: sqlmap` returns `403 Forbidden`
- [ ] A request containing `../` in the path returns `403 Forbidden`
- [ ] CORS preflight from an unlisted origin returns no `Access-Control-Allow-Origin` header
