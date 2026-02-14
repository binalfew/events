# P0-07: CI/CD Pipeline (GitHub Actions)

| Field                  | Value                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Task ID**            | P0-07                                                                         |
| **Phase**              | 0 — Foundation                                                                |
| **Category**           | DevOps                                                                        |
| **Suggested Assignee** | DevOps Engineer                                                               |
| **Depends On**         | P0-02 (Pre-Commit Hooks), P0-05 (Testing Framework), P0-06 (Containerization) |
| **Blocks**             | None                                                                          |
| **Estimated Effort**   | 4 days                                                                        |
| **Module References**  | [Module 06 §5.3](../modules/06-INFRASTRUCTURE-AND-DEVOPS.md)                  |

---

## Context

Every PR must pass automated quality checks before merge, and merges to `develop` and `main` must trigger automated deployments. This task sets up the full CI/CD pipeline using GitHub Actions with a 5-job workflow.

---

## Deliverables

### 1. CI Workflow (`.github/workflows/ci.yml`)

Create a workflow triggered on:

- `push` to `main` and `develop`
- `pull_request` to `main` and `develop`

Concurrency: cancel in-progress runs for the same branch (`cancel-in-progress: true`).

### 2. Job 1: `quality` (timeout: 10 min)

Steps:

1. Checkout code
2. Setup Node.js 20 with npm cache
3. `npm ci`
4. `npx prisma generate`
5. TypeScript type checking: `tsc --noEmit --pretty`
6. ESLint with caching: `eslint . --max-warnings 0`
7. Prettier format check: `prettier --check .`
8. Prisma schema validation: `npx prisma validate`
9. Unused dependency check: `npx depcheck`

### 3. Job 2: `test` (timeout: 20 min, needs: `quality`)

- PostgreSQL 16 service container with health check
- Steps:
  1. Checkout, setup Node, `npm ci`, `prisma generate`
  2. `npx prisma migrate deploy` against test DB
  3. `npx prisma db seed` for test fixtures
  4. `vitest run --coverage` with JUnit reporter (`--reporter=junit --outputFile=test-results.xml`)
  5. Integration tests: `vitest run --config vitest.integration.config.ts`
  6. Upload coverage report artifact (7-day retention)
  7. Upload test results artifact (7-day retention)

### 4. Job 3: `e2e` (timeout: 30 min, needs: `quality`)

- PostgreSQL 16 service container
- Steps:
  1. Checkout, setup Node, `npm ci`, `prisma generate`
  2. `npx prisma migrate deploy` + seed
  3. `npx playwright install --with-deps chromium`
  4. `npx playwright test --project=chromium`
  5. Upload Playwright HTML report artifact (14-day retention)
  6. Upload trace files on failure

### 5. Job 4: `build` (timeout: 15 min, needs: `test` + `e2e`)

- Steps:
  1. Checkout
  2. Setup Docker Buildx
  3. Login to GitHub Container Registry (GHCR)
  4. Generate Docker metadata (tags: SHA, branch name, semver if tagged, `latest` for `main`)
  5. Build and push with `docker/build-push-action@v5` using GitHub Actions cache
  6. Enable provenance and SBOM generation
  7. **Trivy vulnerability scan**: scan the built image for CRITICAL and HIGH vulnerabilities; fail the job if any found (`exit-code: 1`)
  8. Image size check: warn if image exceeds 500 MB

### 6. Job 5: `deploy-staging` (timeout: 15 min, needs: `build`, only on `push` to `develop`)

- Steps:
  1. Azure OIDC login
  2. Deploy image to staging Azure App Service
  3. Health check loop: poll `https://staging.example.com/up` — 30 attempts, 10-second intervals (5-minute timeout)
  4. Run smoke tests: `npx playwright test --config playwright.smoke.config.ts`
  5. Record deployment metadata via API

### 7. Job 6: `deploy-production` (timeout: 20 min, needs: `build`, only on `push` to `main`)

Blue-green deployment:

1. Azure OIDC login
2. Deploy image to **staging slot** (not production)
3. Wait for staging slot health check
4. Pre-swap validation: verify `/health` returns `"status": "healthy"`
5. Swap staging slot → production: `az webapp deployment slot swap`
6. Post-swap verification: poll production `/up` — 12 attempts, 10-second intervals
7. **Automatic rollback** on failure: swap back to previous slot

### 8. CI/CD Secrets Configuration

Document the required GitHub repository secrets:

| Secret                  | Purpose                        |
| ----------------------- | ------------------------------ |
| `AZURE_CLIENT_ID`       | Azure OIDC authentication      |
| `AZURE_TENANT_ID`       | Azure OIDC authentication      |
| `AZURE_SUBSCRIPTION_ID` | Azure OIDC authentication      |
| `DEPLOY_TOKEN`          | Deployment recording API       |
| `SENTRY_AUTH_TOKEN`     | Sentry release tracking        |
| `GHCR_TOKEN`            | GitHub Container Registry push |

---

## Acceptance Criteria

- [ ] Opening a PR triggers the `quality` and `test` jobs automatically
- [ ] A PR with a TypeScript error fails the `quality` job and blocks merge
- [ ] A PR with a failing unit test fails the `test` job and blocks merge
- [ ] A PR with ESLint warnings (`--max-warnings 0`) fails the `quality` job
- [ ] Merging to `develop` triggers build + staging deployment
- [ ] Merging to `main` triggers build + production deployment (blue-green swap)
- [ ] The Trivy scan blocks a build if a CRITICAL vulnerability is found in the Docker image
- [ ] Coverage and test result artifacts are downloadable from the GitHub Actions run
- [ ] Concurrent pushes to the same branch cancel the previous in-progress run
- [ ] Each job has an appropriate timeout to prevent stuck runs
- [ ] All required secrets are documented in a `docs/ci-cd-secrets.md` file
