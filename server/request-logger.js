import { getCorrelationId } from "./correlation.js";
import { logger } from "./logger.js";

/**
 * Express middleware that logs incoming requests and their completion.
 * Captures method, URL, status code, and duration.
 * Automatically includes the correlation ID from AsyncLocalStorage.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function requestLogger(req, res, next) {
  // Skip logging for static asset requests to reduce noise
  if (req.url.startsWith("/assets/") || req.url.startsWith("/@")) {
    return next();
  }

  const start = Date.now();
  const correlationId = getCorrelationId();

  logger.info({
    msg: "incoming request",
    correlationId,
    method: req.method,
    url: req.originalUrl || req.url,
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[logLevel]({
      msg: "request completed",
      correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
}
