import type { Request, Response, NextFunction } from "express";

// ─── Tier Limits (requests per minute) ────────────────────

const TIER_LIMITS: Record<string, number> = {
  STANDARD: 100,
  ELEVATED: 500,
  PREMIUM: 2000,
};

// ─── Sliding Window Store ─────────────────────────────────

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();
const WINDOW_MS = 60_000; // 1 minute

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 5 * 60_000).unref();

// ─── Middleware ───────────────────────────────────────────

export function apiRateLimit(req: Request, res: Response, next: NextFunction) {
  const apiContext = res.locals.apiContext as
    | {
        apiKeyId: string;
        rateLimitTier: string;
        rateLimitCustom: number | null;
      }
    | undefined;

  if (!apiContext) {
    next();
    return;
  }

  const { apiKeyId, rateLimitTier, rateLimitCustom } = apiContext;

  // Determine limit
  let limit: number;
  if (rateLimitTier === "CUSTOM" && rateLimitCustom != null) {
    limit = rateLimitCustom;
  } else {
    limit = TIER_LIMITS[rateLimitTier] ?? TIER_LIMITS.STANDARD;
  }

  const now = Date.now();
  const key = `api:${apiKeyId}`;

  // Get or create window entry
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  const remaining = Math.max(0, limit - entry.timestamps.length);
  const resetAt = now + WINDOW_MS;

  // Set headers
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  if (entry.timestamps.length >= limit) {
    const retryAfter = Math.ceil(WINDOW_MS / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: `Rate limit exceeded. Limit: ${limit} requests per minute.`,
      },
    });
    return;
  }

  // Record this request
  entry.timestamps.push(now);
  res.setHeader("X-RateLimit-Remaining", String(remaining - 1));

  next();
}
