import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { logRateLimitViolation, extractViolationContext } from "./rate-limit-audit.js";

const DEVELOPMENT = process.env.NODE_ENV === "development";

// ─── Nonce Generation ──────────────────────────────────────
// Generates a cryptographically random nonce for each request.
// The nonce is stored on res.locals so it can be read by the
// helmet CSP middleware and passed to React Router via AppLoadContext.
export function nonceMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
  next();
}

// ─── Helmet CSP ────────────────────────────────────────────
// Helmet must be invoked per-request because the CSP nonce changes
// on every request. We call helmet() inside a wrapper middleware
// and use the directive-value function form for the nonce.
export function helmetMiddleware(req: Request, res: Response, next: NextFunction) {
  const nonce = res.locals.cspNonce as string;

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'strict-dynamic'",
          `'nonce-${nonce}'`,
          // 'unsafe-inline' is ignored by browsers that support nonces (CSP Level 2+)
          // but serves as a fallback for older browsers
          ...(DEVELOPMENT ? ["'unsafe-inline'"] : []),
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", ...(DEVELOPMENT ? ["http://localhost:*"] : [])],
        connectSrc: ["'self'", ...(DEVELOPMENT ? ["ws://localhost:*", "http://localhost:*"] : [])],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        workerSrc: ["'self'", ...(DEVELOPMENT ? ["blob:"] : [])],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: DEVELOPMENT ? false : undefined,
    strictTransportSecurity: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })(req, res, next);
}

// ─── CORS ──────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

export const corsMiddleware = cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-API-Key", "If-Match"],
});

// ─── Session Extraction ────────────────────────────────────
// Extracts userId from session cookie and stores on res.locals
// for use by rate-limit key generator. Runs before rate limiters.
export function extractSessionUser(
  getSessionFn: (request: globalThis.Request) => Promise<{ get(key: string): unknown }>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookie = req.headers.cookie || "";
      const fakeReq = new globalThis.Request("http://localhost", {
        headers: { Cookie: cookie },
      });
      const session = await getSessionFn(fakeReq);
      const userId = session.get("userId");
      if (userId && typeof userId === "string") {
        res.locals.userId = userId;
      }
    } catch {
      // Silently fail — unauthenticated users fall back to IP-based limiting
    }
    next();
  };
}

// ─── Rate Limiting Helpers ─────────────────────────────────

export function createKeyGenerator() {
  return (req: Request, res: Response): string => {
    const userId = res.locals.userId as string | undefined;
    if (userId) return `user:${userId}`;
    return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
  };
}

export function skipHealthCheck(req: Request): boolean {
  return req.path === "/up";
}

export function createRateLimitHandler(tier: string, limit: number) {
  return (req: Request, res: Response) => {
    const retryAfter = Math.ceil(Number(res.getHeader("Retry-After")) || 60);
    res.status(429).json({
      error: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Please retry after ${retryAfter} seconds.`,
      retryAfter,
      limit,
      tier,
    });
    logRateLimitViolation(extractViolationContext(req, res, tier, limit));
  };
}

// ─── Rate Limiting ─────────────────────────────────────────

// General limiter: applies to all requests.
export const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900_000,
  limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  skip: skipHealthCheck,
  handler: createRateLimitHandler("general", 100),
  validate: { keyGeneratorIpFallback: false },
});

// Mutation limiter: tighter limit for POST/PUT/PATCH/DELETE on /api.
export const mutationLimiter = rateLimit({
  windowMs: 60_000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  skip: (req: Request) =>
    skipHealthCheck(req) ||
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS",
  handler: createRateLimitHandler("mutation", 50),
  validate: { keyGeneratorIpFallback: false },
});

// Auth limiter: strictest limit for authentication endpoints.
export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  skip: skipHealthCheck,
  handler: createRateLimitHandler("auth", 10),
  validate: { keyGeneratorIpFallback: false },
});

// ─── Route-Specific Limiters ───────────────────────────────

export const fieldsLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  skip: skipHealthCheck,
  handler: createRateLimitHandler("fields", 30),
  validate: { keyGeneratorIpFallback: false },
});

export const searchLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  skip: skipHealthCheck,
  handler: createRateLimitHandler("search", 60),
  validate: { keyGeneratorIpFallback: false },
});

export const reorderLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  skip: skipHealthCheck,
  handler: createRateLimitHandler("reorder", 20),
  validate: { keyGeneratorIpFallback: false },
});

export const uploadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  skip: skipHealthCheck,
  handler: createRateLimitHandler("upload", 10),
  validate: { keyGeneratorIpFallback: false },
});

// ─── Suspicious Request Blocking ───────────────────────────
const SCANNER_AGENTS = /sqlmap|nikto|nessus|openvas/i;
const PATH_TRAVERSAL = /\.\.\//;
const XSS_PATTERN = /<script/i;
const SQLI_PATTERN = /union\s+select/i;

export function suspiciousRequestBlocker(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.headers["user-agent"] || "";
  const path = req.path;
  const url = req.originalUrl || req.url;

  // Missing required headers (likely automated scanner)
  if (!req.headers["user-agent"] || !req.headers["accept"]) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Known vulnerability scanner user agents
  if (SCANNER_AGENTS.test(userAgent)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Path traversal attempts
  if (PATH_TRAVERSAL.test(path) || PATH_TRAVERSAL.test(url)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // Reflected XSS attempts in URL
  if (XSS_PATTERN.test(url)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // SQL injection attempts in URL
  if (SQLI_PATTERN.test(url)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}

// ─── Permissions Policy ────────────────────────────────────
export function permissionsPolicy(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=(), payment=()");
  next();
}
