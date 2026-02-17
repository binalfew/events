import "dotenv/config";
import "./server/sentry.js";
import { captureException } from "./server/sentry.js";
import compression from "compression";
import express from "express";
import { logger } from "./server/logger.js";
import { correlationMiddleware, getCorrelationId } from "./server/correlation.js";
import { requestLogger } from "./server/request-logger.js";
import { startSLACheckJob, stopSLACheckJob } from "./server/sla-job.js";
import { startWebhookRetryJob, stopWebhookRetryJob } from "./server/webhook-retry-job.js";

// Fail fast if required environment variables are missing
const required = ["DATABASE_URL", "SESSION_SECRET"];
for (const name of required) {
  if (!process.env[name]) {
    logger.fatal(
      { variable: name },
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill in the values.`,
    );
    process.exit(1);
  }
}

// Short-circuit the type-checking of the built output.
const BUILD_PATH = "./build/server/index.js";
const SLA_CHECKER_DEV = "./app/services/workflow-engine/sla-checker.server.ts";
const SLA_CHECKER_PROD = "./build/server/services/workflow-engine/sla-checker.server.js";
const WEBHOOK_DELIVERY_DEV = "./app/services/webhook-delivery.server.ts";
const WEBHOOK_DELIVERY_PROD = "./build/server/services/webhook-delivery.server.js";
const DEVELOPMENT = process.env.NODE_ENV === "development";
const PORT = Number.parseInt(process.env.PORT || "3000");

const app = express();

app.use(
  compression({
    filter: (req, res) => {
      // SSE must not be compressed — buffering breaks the event stream
      if (req.path === "/api/sse") return false;
      return compression.filter(req, res);
    },
  }),
);
app.disable("x-powered-by");

// Correlation ID and structured request logging for all requests
app.use(correlationMiddleware);
app.use(requestLogger);

/** @type {() => Promise<any>} */
let slaLoader;
/** @type {() => Promise<any>} */
let webhookLoader;

if (DEVELOPMENT) {
  logger.info("Starting development server");
  const viteDevServer = await import("vite").then((vite) =>
    vite.createServer({
      server: { middlewareMode: true },
    }),
  );
  app.use(viteDevServer.middlewares);
  app.use(async (req, res, next) => {
    try {
      const source = await viteDevServer.ssrLoadModule("./server/app.ts");
      return await source.app(req, res, next);
    } catch (error) {
      if (typeof error === "object" && error instanceof Error) {
        viteDevServer.ssrFixStacktrace(error);
      }
      captureException(error, { correlationId: getCorrelationId() });
      next(error);
    }
  });
  // Use Vite's ssrLoadModule so ~ aliases and TypeScript resolve correctly
  slaLoader = () => viteDevServer.ssrLoadModule(SLA_CHECKER_DEV);
  webhookLoader = () => viteDevServer.ssrLoadModule(WEBHOOK_DELIVERY_DEV);
} else {
  logger.info("Starting production server");
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
  app.use(await import(BUILD_PATH).then((mod) => mod.app));
  slaLoader = () => import(SLA_CHECKER_PROD);
  webhookLoader = () => import(WEBHOOK_DELIVERY_PROD);
}

app.listen(PORT, () => {
  logger.info({ port: PORT }, `Server is running on http://localhost:${PORT}`);

  // Start background jobs
  startSLACheckJob(slaLoader);
  startWebhookRetryJob(webhookLoader);

  const shutdown = () => {
    stopSLACheckJob();
    stopWebhookRetryJob();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});
