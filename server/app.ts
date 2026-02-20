import "react-router";
import { createRequestHandler } from "@react-router/express";
import express from "express";
import { getSession, getUserId } from "~/lib/session.server";
import {
  nonceMiddleware,
  helmetMiddleware,
  corsMiddleware,
  generalLimiter,
  mutationLimiter,
  authLimiter,
  fieldsLimiter,
  searchLimiter,
  reorderLimiter,
  uploadLimiter,
  suspiciousRequestBlocker,
  permissionsPolicy,
  extractSessionUser,
} from "./security.js";
import { createSSERouter } from "./sse.js";
import { createSSETestRouter } from "./sse-test.js";
import { apiRouter } from "./api-router.js";

declare module "react-router" {
  interface AppLoadContext {
    cspNonce: string;
  }
}

export const app = express();

// ─── Security middleware (order matters) ───────────────────
// 1. Generate a per-request nonce first (used by helmet CSP and React)
app.use(nonceMiddleware);

// 2. Set security headers (CSP with nonce, HSTS, X-Frame-Options, etc.)
app.use(helmetMiddleware);

// 3. Permissions-Policy header
app.use(permissionsPolicy);

// 4. CORS
app.use(corsMiddleware);

// 5. Block suspicious requests before they hit rate limiter or app
app.use(suspiciousRequestBlocker);

// 6. Extract session user for user-aware rate limiting
app.use(extractSessionUser(getSession));

// 6b. SSE endpoint (before rate limiter — long-lived connections)
app.use(
  createSSERouter(
    getUserId,
    async (key, context) => {
      const { isFeatureEnabled } = await import("~/lib/feature-flags.server");
      return isFeatureEnabled(key, context);
    },
    async (userId) => {
      const { prisma } = await import("~/lib/db.server");
      const user = await prisma.user.findFirst({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } },
      });
      if (!user || !user.tenantId) return null;
      return {
        tenantId: user.tenantId,
        roles: user.userRoles.map((ur) => ur.role.name),
      };
    },
  ),
);

// 6c. SSE test route (dev only — publishes fake events for testing)
if (process.env.NODE_ENV === "development") {
  app.use(
    createSSETestRouter(getUserId, async (userId) => {
      const { prisma } = await import("~/lib/db.server");
      const user = await prisma.user.findFirst({
        where: { id: userId },
      });
      return user?.tenantId ?? null;
    }),
  );
}

// ─── REST API (before general rate limiter — has its own tier-based limiter) ──
app.use("/api/v1", apiRouter);

// ─── Rate limiting ─────────────────────────────────────────
// 7. General limiter (all routes)
app.use(generalLimiter);

// 8. Route-specific limiters
app.use("/admin/:id/fields", fieldsLimiter);
app.use("/api/:id/search", searchLimiter);
app.use("/api/:id/reorder", reorderLimiter);
app.use("/api/:id/files", uploadLimiter);

// 9. Mutation limiter (non-GET on /api)
app.use("/api", mutationLimiter);

// 10. Auth limiter
app.use("/auth", authLimiter);

// ─── React Router handler ──────────────────────────────────
app.use(
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
    getLoadContext(_req, res) {
      return {
        cspNonce: res.locals.cspNonce as string,
      };
    },
  }),
);
