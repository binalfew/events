# P0-06: Containerization (Dockerfile + Docker Compose)

| Field                  | Value                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| **Task ID**            | P0-06                                                              |
| **Phase**              | 0 — Foundation                                                     |
| **Category**           | DevOps                                                             |
| **Suggested Assignee** | DevOps Engineer                                                    |
| **Depends On**         | P0-01 (Secret Rotation — env var structure)                        |
| **Blocks**             | P0-07 (CI/CD)                                                      |
| **Estimated Effort**   | 3 days                                                             |
| **Module References**  | [Module 06 §5.1, §5.2](../modules/06-INFRASTRUCTURE-AND-DEVOPS.md) |

---

## Context

The application needs reproducible containerized environments for development, CI, and production. A multi-stage Dockerfile minimizes the production image size, and Docker Compose provides a one-command local development stack including PostgreSQL, Azure Storage emulator, and email testing.

---

## Deliverables

### 1. Multi-Stage Dockerfile

Create a 4-stage Dockerfile based on `node:20-alpine`:

| Stage          | Purpose                 | Key Steps                                                                                         |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| **base**       | Common foundation       | Install `dumb-init`, `curl`, `tini`; run security updates                                         |
| **deps**       | Production dependencies | `npm ci --omit=dev --ignore-scripts`; `prisma generate`                                           |
| **build**      | Full build              | `npm ci`; `prisma generate`; `npm run build`                                                      |
| **production** | Final image             | Copy `node_modules` from `deps`, `build/` + `server.js` + `package.json` + `prisma/` from `build` |

Production stage requirements:

- `ENV NODE_ENV=production`
- `ENV PORT=8080`
- Run as non-root user: `USER node` (uid 1000)
- `EXPOSE 8080`
- Health check: `HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl -f http://localhost:8080/up || exit 1`
- Entry point: `ENTRYPOINT ["dumb-init", "--"]` / `CMD ["node", "server.js"]`

### 2. `.dockerignore`

Create `.dockerignore` excluding:

- `.git`, `node_modules`, `build`
- `.env*` (except `.env.example`)
- Test files (`tests/`, `*.test.ts`, `*.spec.ts`)
- Documentation (`docs/`, `*.md` except `README.md`)
- `.github`, `.husky`, IDE config (`.vscode/`, `.idea/`)
- Terraform/infrastructure files

### 3. Docker Compose (`docker-compose.yml`)

Define 5 services on a bridge network:

| Service     | Image                                            | Ports                      | Purpose                                                                   |
| ----------- | ------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------- |
| **app**     | Build from Dockerfile (target: `build`)          | `8080:8080`, `9229:9229`   | Application with hot reload, volume mounts for source code, debugger port |
| **db**      | `postgres:16-alpine`                             | `5432:5432`                | Development database with persistent `pgdata` volume and health check     |
| **db-test** | `postgres:16-alpine`                             | `5433:5432`                | Test database using `tmpfs` (in-memory, no persistence — fast for tests)  |
| **storage** | `mcr.microsoft.com/azure-storage/azurite:latest` | `10000-10002`              | Azure Blob/Queue/Table emulator                                           |
| **mailpit** | `axllent/mailpit:latest`                         | `8025` (UI), `1025` (SMTP) | Email capture — catches all outbound email, web UI for inspection         |

Requirements:

- `db` service: init script that creates the development database, health check via `pg_isready`
- `db-test` service: `tmpfs` mount for `/var/lib/postgresql/data` (in-memory for speed)
- `app` service: volume mounts for `./app`, `./prisma`, `./public` (hot reload); depends on `db` health check
- Named volumes: `pgdata`, `azurite-data`, `mailpit-data`
- Network: bridge network with defined subnet (`172.28.0.0/16`)

### 4. Compose Utility Scripts

Add to `package.json`:

| Script            | Command                                                                                                  | Purpose                          |
| ----------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `docker:up`       | `docker compose up -d`                                                                                   | Start all services in background |
| `docker:down`     | `docker compose down`                                                                                    | Stop all services                |
| `docker:logs`     | `docker compose logs -f app`                                                                             | Follow application logs          |
| `docker:db:reset` | `docker compose exec db psql -U postgres -c 'DROP DATABASE IF EXISTS accreditation;' && npm run db:push` | Reset dev database               |

### 5. Verify Image Constraints

- Final production image size: **< 500 MB**
- Application runs as non-root user (verify with `docker exec <container> whoami` → `node`)
- Health check passes within 30 seconds of container start
- No `devDependencies` in the production image (verify with `docker exec <container> npm ls --omit=dev`)

---

## Acceptance Criteria

- [ ] `docker compose up` starts all 5 services and the application is reachable at `http://localhost:8080`
- [ ] Full stack starts in **under 60 seconds** from cold (no cached layers)
- [ ] Changing a `.ts` file in `app/` triggers hot reload inside the container without restart
- [ ] `docker compose exec app node -e "console.log('ok')"` runs as user `node`, not `root`
- [ ] Production Docker image is under 500 MB (`docker images | grep accreditation`)
- [ ] `http://localhost:8080/up` returns `200 OK` (health check passes)
- [ ] `http://localhost:8025` opens the Mailpit web UI for email inspection
- [ ] Azurite is accessible and blob operations work via the Azure Storage SDK with `UseDevelopmentStorage=true`
- [ ] `db-test` service uses `tmpfs` and loses data on restart (by design)
- [ ] `docker compose down && docker compose up` restores the `db` service data from the `pgdata` volume
