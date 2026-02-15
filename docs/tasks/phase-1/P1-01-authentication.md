# P1-01: Authentication & Session Management

| Field                  | Value                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Task ID**            | P1-01                                                                        |
| **Phase**              | 1 — Dynamic Schema + Core Reliability                                        |
| **Category**           | Security                                                                     |
| **Suggested Assignee** | Senior Backend Engineer                                                      |
| **Depends On**         | P1-00                                                                        |
| **Blocks**             | P1-05 (Admin UI), P1-10 (Rate Limiting Enhancement)                          |
| **Estimated Effort**   | 4 days                                                                       |
| **Module References**  | [Module 05 §Authentication](../../modules/05-SECURITY-AND-ACCESS-CONTROL.md) |

---

## Context

Phase 1 features like the custom field admin UI, rate limiting on authenticated routes, and workflow operations all require a working authentication system. The User, Password, and Session models already exist from Phase 0. This task builds the login/logout flows, session middleware, password hashing, and basic role-based access control.

This is a **minimal but complete** auth system — enough to protect routes and identify users. Advanced features (2FA, OAuth, password reset email) are deferred to later phases.

---

## Deliverables

### 1. Password Utilities (`app/lib/auth.server.ts`)

```typescript
// Hashing and verification using bcryptjs
export async function hashPassword(password: string): Promise<string>;
export async function verifyPassword(password: string, hash: string): Promise<boolean>;
```

- Use `bcryptjs` with cost factor 10
- Never log or expose password hashes

### 2. Session Management (`app/lib/session.server.ts`)

Cookie-based session management using React Router's `createCookieSessionStorage`:

```typescript
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET!],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function createUserSession(userId: string, redirectTo: string): Promise<Response>;
export async function getUserId(request: Request): Promise<string | null>;
export async function requireUserId(request: Request, redirectTo?: string): Promise<string>;
export async function requireUser(request: Request): Promise<User & { userRoles: UserRole[] }>;
export async function logout(request: Request): Promise<Response>;
```

### 3. Login Route (`app/routes/auth.login.tsx`)

- **GET**: Render login form (email + password)
- **POST (action)**: Validate credentials, check account lockout, create session
- Redirect authenticated users to `/dashboard`
- Progressive enhancement: works without JavaScript

**Login flow:**

1. Validate form data with Zod (email required, password required)
2. Find user by email (including `deletedAt IS NULL` check)
3. Check account lockout (`lockedAt`, `autoUnlockAt`)
4. Verify password hash
5. On failure: increment `failedLoginAttempts`, lock after 5 failures
6. On success: reset `failedLoginAttempts`, create session, redirect
7. Log login attempt to AuditLog

### 4. Logout Route (`app/routes/auth.logout.tsx`)

- **POST (action)**: Destroy session, redirect to login
- Log logout to AuditLog

### 5. Auth Middleware (`app/lib/require-auth.server.ts`)

Utility functions for protecting routes:

```typescript
// Require authenticated user (redirects to login if not)
export async function requireAuth(request: Request): Promise<{
  user: User;
  roles: string[];
}>;

// Require specific role
export async function requireRole(
  request: Request,
  role: string,
): Promise<{
  user: User;
  roles: string[];
}>;

// Require any of the given roles
export async function requireAnyRole(
  request: Request,
  roles: string[],
): Promise<{
  user: User;
  roles: string[];
}>;

// Check permission (non-throwing — returns boolean)
export async function hasPermission(
  userId: string,
  resource: string,
  action: string,
): Promise<boolean>;
```

### 6. Dashboard Layout Route (`app/routes/_dashboard.tsx`)

A layout route that wraps all authenticated pages:

- Call `requireAuth(request)` in the loader
- Render a sidebar/header shell with user info, logout button
- Outlet for child routes
- Pass user data and roles to children via loader

### 7. Dashboard Index (`app/routes/_dashboard._index.tsx`)

A placeholder dashboard page showing:

- Welcome message with user's name
- Quick stats (placeholder for now: "0 events", "0 participants")
- Navigation links to future admin sections

### 8. Update Seed File

Ensure the default admin user has:

- A hashed password (e.g., "password123" for development only)
- The ADMIN role assigned via UserRole

### 9. Tests

Write tests for:

- `hashPassword` and `verifyPassword` round-trip
- `getUserId` returns null for unauthenticated requests
- `requireUserId` throws redirect for unauthenticated requests
- Account lockout after 5 failed attempts
- Account auto-unlock after lockout period
- Login action validates input and creates session
- Logout destroys session

---

## Acceptance Criteria

- [ ] Navigating to `/dashboard` without a session redirects to `/auth/login`
- [ ] Logging in with valid credentials creates a session and redirects to `/dashboard`
- [ ] Logging in with invalid credentials shows an error message
- [ ] After 5 failed login attempts, the account is locked
- [ ] Locked accounts show a "locked" message and cannot log in
- [ ] The logout button destroys the session and redirects to `/auth/login`
- [ ] `requireRole("ADMIN")` blocks non-admin users with a 403
- [ ] All login/logout events are recorded in AuditLog
- [ ] Session cookie is `httpOnly`, `sameSite: lax`, `secure` in production
- [ ] `npm run typecheck` passes with zero errors
- [ ] Unit tests pass for all auth utilities
