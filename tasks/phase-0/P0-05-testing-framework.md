# P0-05: Testing Framework (Vitest + MSW + Playwright)

| Field                  | Value                                                        |
| ---------------------- | ------------------------------------------------------------ |
| **Task ID**            | P0-05                                                        |
| **Phase**              | 0 — Foundation                                               |
| **Category**           | Quality                                                      |
| **Suggested Assignee** | Senior Backend Engineer                                      |
| **Depends On**         | P0-02 (Pre-Commit Hooks)                                     |
| **Blocks**             | P0-07 (CI/CD), P0-10 (Soft Delete)                           |
| **Estimated Effort**   | 4 days                                                       |
| **Module References**  | [Module 06 §5.4](../modules/06-INFRASTRUCTURE-AND-DEVOPS.md) |

---

## Context

The project needs a comprehensive testing infrastructure that supports unit tests, integration tests (with a real database), and end-to-end tests. This task establishes the framework and initial test suite — subsequent tasks will add tests for their own deliverables.

---

## Deliverables

### 1. Vitest Configuration — Unit Tests (`vitest.config.ts`)

- Use `v8` coverage provider
- Coverage thresholds: **80% statements, 75% branches, 80% functions, 80% lines**
- Pool: `forks` with min 1, max 4 workers
- Include: `app/**/*.{test,spec}.{ts,tsx}`
- Exclude: `node_modules`, `build`, `tests/e2e`, `tests/integration`
- Setup file: `tests/setup/unit-setup.ts`
- Coverage reporters: `text`, `lcov`, `json-summary`

### 2. Vitest Configuration — Integration Tests (`vitest.integration.config.ts`)

- Separate config for integration tests that hit a real PostgreSQL database
- Timeout: **30 seconds** per test
- Pool: `forks` with min 1, max 2 workers (limited by DB connections)
- Include: `tests/integration/**/*.{test,spec}.ts`
- Setup file: `tests/setup/integration-setup.ts`
- Global setup: run Prisma migrations on the test database before the suite

### 3. Integration Test Database Setup (`tests/setup/integration-setup.ts`)

- Connect to a dedicated test database (`DATABASE_URL` with `accreditation_test` or use `db-test` from Docker Compose on port 5433)
- Before each test: truncate all tables in the correct order respecting foreign key constraints
- After all tests: disconnect Prisma client
- Provide a shared `prisma` client instance for test files

### 4. MSW Mock Handlers (`tests/mocks/handlers.ts`)

Create Mock Service Worker handlers for external services:

| Service                      | Mocked Endpoints        | Behavior                                        |
| ---------------------------- | ----------------------- | ----------------------------------------------- |
| Azure Blob Storage           | `PUT /:container/:blob` | Accept upload, store in-memory Map              |
| Azure Blob Storage           | `GET /:container/:blob` | Return from in-memory Map or 404                |
| Azure Communication Services | `POST /emails:send`     | Accept, store in in-memory array for assertions |

- Create `tests/mocks/server.ts` that sets up an MSW server with these handlers
- Wire into unit test setup (`beforeAll` → start, `afterEach` → reset handlers, `afterAll` → close)

### 5. Test Factories (`tests/factories/index.ts`)

Create factory functions that produce valid test data:

| Factory                        | Creates                | Key Defaults                                          |
| ------------------------------ | ---------------------- | ----------------------------------------------------- |
| `buildTenant(overrides?)`      | Tenant record          | Random name, PROFESSIONAL plan, default feature flags |
| `buildUser(overrides?)`        | User record            | Random email, hashed password, ACTIVE status          |
| `buildEvent(overrides?)`       | Event record           | Linked to tenant, DRAFT status, future dates          |
| `buildParticipant(overrides?)` | Participant record     | Linked to event + tenant, PENDING status              |
| `seedFullScenario(prisma)`     | Complete test scenario | Tenant → Users → Event → Participants → Workflow      |

- Factories for unit tests return plain objects (no DB writes)
- `seedFullScenario` uses Prisma to create records in the test database for integration tests

### 6. Playwright Configuration (`playwright.config.ts`)

- Projects: `chromium`, `mobile-safari` (iPhone 13 viewport), `smoke` (chromium, 1 worker)
- Setup project: authenticate and save storage state to `tests/e2e/.auth/`
- Traces: on first retry
- Screenshots: on failure
- Base URL: `http://localhost:3000`
- Web server: `npm run dev` (auto-started by Playwright)
- Retries: 1 on CI, 0 locally

### 7. Initial Test Suite — Workflow Engine

Write unit tests for the existing workflow engine code to establish the ≥ 80% coverage target:

- Test workflow state transitions (valid and invalid)
- Test step routing logic (linear, conditional)
- Test SLA deadline calculation
- Test approval/rejection logic
- Test edge cases: duplicate approvals, transitions on archived workflows, missing step configurations

### 8. NPM Scripts

Add the following scripts to `package.json`:

| Script             | Command                                            | Purpose                         |
| ------------------ | -------------------------------------------------- | ------------------------------- |
| `test`             | `vitest run`                                       | Run unit tests once             |
| `test:watch`       | `vitest`                                           | Run unit tests in watch mode    |
| `test:coverage`    | `vitest run --coverage`                            | Unit tests with coverage report |
| `test:integration` | `vitest run --config vitest.integration.config.ts` | Integration tests               |
| `test:e2e`         | `playwright test`                                  | End-to-end tests                |
| `test:e2e:ui`      | `playwright test --ui`                             | E2E tests with interactive UI   |

---

## Acceptance Criteria

- [ ] `npm test` runs unit tests and exits with 0 if all pass
- [ ] `npm run test:coverage` produces a coverage report meeting the 80/75/80/80 thresholds
- [ ] `npm run test:integration` runs against a real PostgreSQL database and passes (requires Docker Compose `db-test` service running)
- [ ] `npm run test:e2e` launches the dev server, runs Playwright tests in chromium, and produces a report
- [ ] MSW handlers intercept Azure Blob Storage and Email calls without hitting real services
- [ ] Test factories produce valid data that passes Prisma schema validation
- [ ] `seedFullScenario` creates a complete Tenant → Event → Participant → Workflow chain in the test DB
- [ ] Workflow engine has ≥ 80% statement coverage with meaningful assertions (not just smoke tests)
- [ ] Test files follow the naming convention `*.test.ts` / `*.spec.ts`
- [ ] Running `npm test` in CI (no database) does not attempt integration or E2E tests
