import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { logger } from "~/lib/logger.server";

export interface RequestContext {
  correlationId: string;
  tenantId?: string;
  userId?: string;
  requestPath: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Returns the current request context from AsyncLocalStorage, if available.
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Returns the current correlation ID, or a fallback string if not in a request context.
 */
export function getCorrelationId(): string {
  return asyncLocalStorage.getStore()?.correlationId ?? "no-correlation-id";
}

/**
 * Creates a child logger with the current correlation ID attached.
 * Useful in loaders/actions to automatically include request tracing info.
 */
export function getRequestLogger() {
  const context = getRequestContext();
  if (context) {
    return logger.child({ correlationId: context.correlationId });
  }
  return logger;
}

/**
 * Express middleware that attaches a correlation ID to each request.
 * Reads from incoming x-correlation-id or x-request-id headers, or generates a new UUID.
 * Stores the context in AsyncLocalStorage for downstream access.
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    crypto.randomUUID();

  const context: RequestContext = {
    correlationId,
    requestPath: req.path,
  };

  res.setHeader("x-correlation-id", correlationId);

  asyncLocalStorage.run(context, () => {
    next();
  });
}
