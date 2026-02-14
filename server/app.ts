import "react-router";
import { createRequestHandler } from "@react-router/express";
import express from "express";
import {
  nonceMiddleware,
  helmetMiddleware,
  corsMiddleware,
  generalLimiter,
  mutationLimiter,
  authLimiter,
  suspiciousRequestBlocker,
  permissionsPolicy,
} from "./security.js";

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

// ─── Rate limiting ─────────────────────────────────────────
app.use(generalLimiter);
app.use("/api", mutationLimiter);
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
