import type { Request, Response, NextFunction } from "express";

/**
 * Express middleware for X-API-Key authentication.
 * Validates the key, checks IP allowlist, sets apiContext on res.locals.
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Check feature flag
    const { isFeatureEnabled, FEATURE_FLAG_KEYS } = await import("~/lib/feature-flags.server");
    const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.REST_API);
    if (!enabled) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "REST API is not enabled" },
      });
      return;
    }

    // 2. Extract X-API-Key header
    const rawKey = req.headers["x-api-key"] as string | undefined;
    if (!rawKey) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Missing X-API-Key header" },
      });
      return;
    }

    // 3. Validate key
    const { validateApiKey, trackApiKeyUsage } = await import("~/services/api-keys.server");
    const result = await validateApiKey(rawKey);
    if (!result) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Invalid or expired API key" },
      });
      return;
    }

    // 4. Check IP allowlist
    const apiKey = await (async () => {
      const { prisma } = await import("~/lib/db.server");
      return prisma.apiKey.findUnique({
        where: { id: result.apiKeyId },
        select: { allowedIps: true },
      });
    })();

    if (apiKey?.allowedIps && apiKey.allowedIps.length > 0) {
      const clientIp = req.ip || req.socket.remoteAddress || "";
      if (!apiKey.allowedIps.includes(clientIp)) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "IP address not allowed" },
        });
        return;
      }
    }

    // 5. Set API context
    res.locals.apiContext = {
      tenantId: result.tenantId,
      permissions: result.permissions,
      apiKeyId: result.apiKeyId,
      rateLimitTier: result.rateLimitTier,
      rateLimitCustom: result.rateLimitCustom,
    };

    // 6. Fire-and-forget usage tracking
    const clientIp = req.ip || req.socket.remoteAddress || "";
    trackApiKeyUsage(result.apiKeyId, clientIp);

    next();
  } catch (error) {
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Authentication error" },
    });
  }
}
