# P0-01: Secret Rotation & `.env.example`

| Field                  | Value                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Task ID**            | P0-01                                                                                                                                                                                |
| **Phase**              | 0 — Foundation                                                                                                                                                                       |
| **Category**           | Security                                                                                                                                                                             |
| **Suggested Assignee** | Senior Backend Engineer                                                                                                                                                              |
| **Depends On**         | P0-00 (Project Scaffolding)                                                                                                                                                          |
| **Blocks**             | P0-03 (Logging), P0-04 (CSP), P0-06 (Docker)                                                                                                                                         |
| **Estimated Effort**   | 2 days                                                                                                                                                                               |
| **Module References**  | [Module 05 §8](../modules/05-SECURITY-AND-ACCESS-CONTROL.md), [Module 06 §8.1](../modules/06-INFRASTRUCTURE-AND-DEVOPS.md), [Module 00 §8.1](../modules/00-ARCHITECTURE-OVERVIEW.md) |

---

## Context

The codebase currently has secrets committed in `.env` files or hardcoded in configuration. All secrets must be extracted to environment variables, the `.env` file must be removed from version control, and a `.env.example` with placeholder values must be committed as a reference.

---

## Deliverables

### 1. Remove `.env` from Version Control

- Add `.env*` (except `.env.example`) to `.gitignore`
- Remove any existing `.env` files from git history using `git rm --cached`
- Verify no secrets remain in tracked files

### 2. Create `.env.example`

Create a `.env.example` file containing every environment variable the application needs, organized by category, with placeholder values only. The file must include all 45 variables specified in Module 06 Appendix C:

```
# ─── Database ───────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/accreditation"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_QUERY_TIMEOUT=5000
DATABASE_CONNECTION_TIMEOUT=10000
DATABASE_SSL_MODE=prefer

# ─── Authentication ────────────────────────────────────
SESSION_SECRET="generate-a-random-32-char-string"
SESSION_MAX_AGE=2592000000
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# ─── Azure Storage ─────────────────────────────────────
AZURE_STORAGE_CONNECTION_STRING="UseDevelopmentStorage=true"
AZURE_STORAGE_CONTAINER_UPLOADS="uploads"
AZURE_STORAGE_CONTAINER_BACKUPS="backups"
MAX_UPLOAD_SIZE_MB=10

# ─── Azure Communication Services ─────────────────────
AZURE_COMM_CONNECTION_STRING=""
EMAIL_FROM_ADDRESS="noreply@accredit.io"
EMAIL_FROM_NAME="Accreditation Platform"

# ─── Monitoring ────────────────────────────────────────
SENTRY_DSN=""
SENTRY_TRACES_SAMPLE_RATE=0.1
APPLICATIONINSIGHTS_CONNECTION_STRING=""
LOG_LEVEL=info

# ─── Application ───────────────────────────────────────
NODE_ENV=development
PORT=3000
APP_VERSION=""
BASE_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000"
```

(Include all remaining categories: Jobs, Security, Feature Flags, SMTP)

### 3. Rotate All Existing Secrets

- Generate new values for: `SESSION_SECRET`, `DATABASE_URL` credentials, any API keys
- Document the rotation procedure in a `docs/secret-rotation.md` file so it can be repeated
- Ensure no old secret values remain functional

### 4. Validate Application Startup

- Application must start successfully using only `.env.example` as a reference (after filling in real values)
- Application must fail fast with a clear error message if a required variable is missing (e.g., `DATABASE_URL`, `SESSION_SECRET`)

---

## Acceptance Criteria

- [ ] `.env` is not tracked by git; `.gitignore` includes `.env*` exclusion
- [ ] `.env.example` is committed with placeholder values for all 45+ environment variables
- [ ] No secrets (passwords, connection strings, API keys) exist in any tracked file — verify with `git log --all -p | grep -i "password\|secret\|api_key\|connection_string"` (should return zero relevant results)
- [ ] Application fails fast on startup if `DATABASE_URL` or `SESSION_SECRET` is missing, with a human-readable error message
- [ ] All existing secrets have been rotated to new values in the deployment environment
- [ ] `docs/secret-rotation.md` documents the procedure for rotating each secret category
