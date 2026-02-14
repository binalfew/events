# P0-00: Project Scaffolding (React Router 7 + Express)

| Field                  | Value                                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task ID**            | P0-00                                                                                                                                                                       |
| **Phase**              | 0 — Foundation                                                                                                                                                              |
| **Category**           | Setup                                                                                                                                                                       |
| **Suggested Assignee** | Senior Backend Engineer                                                                                                                                                     |
| **Depends On**         | None                                                                                                                                                                        |
| **Blocks**             | All other Phase 0 tasks (P0-01 through P0-10)                                                                                                                               |
| **Estimated Effort**   | 2 days                                                                                                                                                                      |
| **Module References**  | [Module 00 §2.1](../modules/00-ARCHITECTURE-OVERVIEW.md), [Module 01](../modules/01-DATA-MODEL-FOUNDATION.md), [Module 06 §5.2](../modules/06-INFRASTRUCTURE-AND-DEVOPS.md) |

---

## Context

The project needs to be bootstrapped from scratch using the React Router 7 template with a custom Node/Express server. This template provides server-side rendering via Express, which aligns with the architecture spec (React Router 7 + Vite + Express 4). The template ships with Tailwind CSS already configured. Once scaffolded, the project needs Prisma and the remaining core dependency stack wired in before any other Phase 0 work can begin.

---

## Deliverables

### 1. Scaffold the Application

Run the official React Router 7 template with custom Express server:

```bash
npx create-react-router@latest --template remix-run/react-router-templates/node-custom-server
```

This provides:

- React Router 7 with Vite
- Custom Express `server.ts` entry point
- SSR configured out of the box
- TypeScript setup
- Tailwind CSS pre-configured (no additional Tailwind setup needed)

### 2. Initialize Git Repository

- `git init`
- Create a `.gitignore` covering: `node_modules/`, `build/`, `.env*` (except `.env.example`), `.DS_Store`, `coverage/`, `playwright-report/`, `test-results/`, `.cache/`
- Make an initial commit: `chore: scaffold react router 7 app with custom express server`

### 3. Install Core Dependencies

Install the dependencies specified in the architecture (Module 00 §2.1):

**Production dependencies:**

| Package                                                                                         | Purpose                                              |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `@prisma/client`                                                                                | Database ORM                                         |
| `prisma` (dev)                                                                                  | Prisma CLI for migrations and generation             |
| `@radix-ui/react-*` (start with: `slot`, `dialog`, `dropdown-menu`, `toast`, `tooltip`, `tabs`) | Accessible UI primitives                             |
| `conform-to/react`, `@conform-to/zod`                                                           | Server-validated forms                               |
| `zod`                                                                                           | Schema validation                                    |
| `bcryptjs` + `@types/bcryptjs`                                                                  | Password hashing                                     |
| `pino` + `pino-pretty` (dev)                                                                    | Structured logging (wired in P0-03, but install now) |
| `helmet`                                                                                        | Security headers (wired in P0-04, but install now)   |
| `express-rate-limit`                                                                            | Rate limiting (wired in P0-04, but install now)      |
| `cors` + `@types/cors`                                                                          | CORS middleware                                      |

**Dev dependencies:**

| Package                                                                      | Purpose                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------- |
| `vitest`, `@vitest/coverage-v8`                                              | Test runner + coverage                      |
| `msw`                                                                        | Mock Service Worker                         |
| `@playwright/test`                                                           | E2E testing                                 |
| `eslint`, `prettier`                                                         | Linting + formatting                        |
| `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional` | Git hooks (wired in P0-02, but install now) |

### 4. Configure Prisma

- `npx prisma init` — creates `prisma/schema.prisma` and a `.env` placeholder
- Set the provider to `postgresql`
- Configure the Prisma schema with the foundational models needed to start:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id               String   @id @default(cuid())
  name             String   @unique
  email            String   @unique
  phone            String
  website          String?
  address          String?
  city             String?
  state            String?
  zip              String?
  country          String?
  subscriptionPlan String   @default("STARTER")
  featureFlags     Json?
  usageMetrics     Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  users  User[]
  events Event[]

  @@index([name, email])
}

model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  firstName           String
  lastName            String
  tenantId            String?
  tenant              Tenant?   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  status              String    @default("ACTIVE")
  failedLoginAttempts Int       @default(0)
  lockedAt            DateTime?
  autoUnlockAt        DateTime?
  lockCount           Int       @default(0)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  password Password?
  sessions Session[]

  @@index([tenantId])
  @@index([email])
}

model Password {
  hash   String
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId, expiresAt])
}

model Event {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  description String?
  status      String   @default("DRAFT")
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, name])
  @@index([tenantId])
  @@index([tenantId, status])
}
```

- Run `npx prisma migrate dev --name init` to create the initial migration
- Create a basic seed file (`prisma/seed.ts`) that creates a default tenant and admin user

### 5. Set Up Basic Project Structure

Create the following directory structure inside `app/`:

```
app/
├── components/        # Shared UI components
│   └── ui/            # Radix-based primitives
├── lib/               # Server utilities (logger, db, etc.)
│   └── db.server.ts   # Prisma client singleton
├── utils/             # Shared utilities
├── routes/            # React Router 7 route modules
│   ├── _index.tsx     # Landing / redirect
│   └── up.tsx         # Health check (GET /up → 200 "OK")
└── styles/            # CSS
```

### 6. Prisma Client Singleton (`app/lib/db.server.ts`)

Create the standard Prisma client singleton to prevent multiple instances in development:

```typescript
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var __prisma__: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma__) {
    global.__prisma__ = new PrismaClient();
  }
  prisma = global.__prisma__;
}

export { prisma };
```

### 7. Health Check Route (`app/routes/up.tsx`)

Create a minimal liveness probe endpoint:

```typescript
// GET /up → 200 "OK"
export function loader() {
  return new Response("OK", { status: 200 });
}
```

### 8. Verify the Full Stack Runs

- `npm run dev` starts the Express server with Vite HMR
- Navigating to `http://localhost:3000` renders the default page with Tailwind styles applied
- `http://localhost:3000/up` returns `200 OK`
- Prisma can connect to a local PostgreSQL database and run queries

### 9. NPM Scripts

Ensure these scripts exist in `package.json`:

| Script       | Command              | Purpose                       |
| ------------ | -------------------- | ----------------------------- |
| `dev`        | (from template)      | Start dev server with HMR     |
| `build`      | (from template)      | Production build              |
| `start`      | (from template)      | Start production server       |
| `db:migrate` | `prisma migrate dev` | Run migrations in dev         |
| `db:push`    | `prisma db push`     | Push schema without migration |
| `db:seed`    | `prisma db seed`     | Seed the database             |
| `db:studio`  | `prisma studio`      | Open Prisma Studio GUI        |
| `typecheck`  | `tsc --noEmit`       | Type check without emitting   |
| `lint`       | `eslint .`           | Run ESLint                    |
| `format`     | `prettier --write .` | Format all files              |

---

## Acceptance Criteria

- [ ] `git log` shows an initial commit with the scaffolded project
- [ ] `npm run dev` starts the application at `http://localhost:3000` without errors
- [ ] The default page renders with Tailwind CSS styles applied (verify a utility class like `text-blue-500` works)
- [ ] `http://localhost:3000/up` returns HTTP 200 with body `OK`
- [ ] `npx prisma migrate dev` runs successfully and creates `Tenant`, `User`, `Password`, `Session`, and `Event` tables
- [ ] `npx prisma db seed` creates a default tenant and admin user
- [ ] `npx prisma studio` opens and shows the seeded data
- [ ] `npm run typecheck` passes with zero TypeScript errors
- [ ] `npm run lint` passes with zero ESLint errors
- [ ] `app/lib/db.server.ts` exports a working Prisma client singleton
- [ ] The project structure matches the directory layout specified above
- [ ] All production and dev dependencies from the table above are installed in `package.json`
