import express, { Router } from "express";
import type { Request, Response } from "express";
import { requireApiPermission } from "~/services/api-permission.server";
import { apiKeyAuth } from "./api-auth.js";
import { apiRateLimit } from "./api-rate-limit.js";

// ─── Types ────────────────────────────────────────────────

interface ApiContext {
  tenantId: string;
  permissions: string[];
  apiKeyId: string;
  rateLimitTier: string;
  rateLimitCustom: number | null;
}

interface PaginationParams {
  page: number;
  pageSize: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  fields?: string[];
}

// ─── Helpers ──────────────────────────────────────────────

function getApiContext(res: Response): ApiContext {
  return res.locals.apiContext as ApiContext;
}

function queryString(val: unknown): string | undefined {
  if (typeof val === "string") return val;
  if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  return undefined;
}

function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(queryString(req.query.page) ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(queryString(req.query.pageSize) ?? "20")));

  let sort: string | undefined;
  let sortDir: "asc" | "desc" = "desc";
  const sortParam = queryString(req.query.sort);
  if (sortParam) {
    const parts = sortParam.split(":");
    sort = parts[0];
    if (parts[1] === "asc" || parts[1] === "desc") sortDir = parts[1];
  }

  const fieldsParam = queryString(req.query.fields);
  const fields = fieldsParam ? fieldsParam.split(",").map((f) => f.trim()) : undefined;

  return { page, pageSize, sort, sortDir, fields };
}

function selectFields(fields?: string[]): Record<string, boolean> | undefined {
  if (!fields || fields.length === 0) return undefined;
  const select: Record<string, boolean> = {};
  for (const f of fields) {
    select[f] = true;
  }
  select.id = true;
  return select;
}

function wrapResponse(data: unknown, meta?: Record<string, unknown>) {
  return meta ? { data, meta } : { data };
}

function errorResponse(res: Response, code: string, message: string, status: number) {
  res.status(status).json({ error: { code, message } });
}

// ─── Router ───────────────────────────────────────────────

export const apiRouter = Router();
apiRouter.use("/events", express.json(), apiKeyAuth, apiRateLimit);

// ─── Events ───────────────────────────────────────────────

apiRouter.get("/events", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "events", "read");

    const { prisma } = await import("~/lib/db.server");
    const { page, pageSize, sort, sortDir, fields } = parsePagination(req);

    const where: Record<string, unknown> = { tenantId: ctx.tenantId, deletedAt: null };
    const statusParam = queryString(req.query.status);
    if (statusParam) where.status = statusParam;

    const select = selectFields(fields) ?? {
      id: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      extras: true,
      createdAt: true,
      updatedAt: true,
    };

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select,
        orderBy: sort ? { [sort]: sortDir } : { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        includeDeleted: true,
      } as any),
      prisma.event.count({ where, includeDeleted: true } as any),
    ]);

    const totalNum = Number(total);
    res.json(
      wrapResponse(items, {
        page,
        pageSize,
        total: totalNum,
        totalPages: Math.ceil(totalNum / pageSize),
      }),
    );
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to list events", 500);
  }
});

apiRouter.get("/events/:eventId", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "events", "read");

    const { prisma } = await import("~/lib/db.server");
    const expandParam = queryString(req.query.expand);
    const expand = expandParam?.split(",") ?? [];

    const event = await (prisma.event.findFirst as any)({
      where: { id: req.params.eventId, tenantId: ctx.tenantId, deletedAt: null },
      include: {
        ...(expand.includes("participantTypes") && { participantTypes: true }),
        ...(expand.includes("workflows") && { workflows: { where: { deletedAt: null } } }),
      },
      includeDeleted: true,
    });

    if (!event) return errorResponse(res, "NOT_FOUND", "Event not found", 404);

    const etag = `"${new Date(event.updatedAt).getTime()}"`;
    res.setHeader("ETag", etag);

    res.json(wrapResponse(event));
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to get event", 500);
  }
});

apiRouter.post("/events", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "events", "create");

    const { prisma } = await import("~/lib/db.server");
    const body = req.body;

    if (!body.name) return errorResponse(res, "VALIDATION_ERROR", "name is required", 400);
    if (!body.startDate)
      return errorResponse(res, "VALIDATION_ERROR", "startDate is required", 400);
    if (!body.endDate) return errorResponse(res, "VALIDATION_ERROR", "endDate is required", 400);

    const createData: Record<string, unknown> = {
      tenantId: ctx.tenantId,
      name: body.name,
      description: body.description ?? "",
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      status: body.status ?? "DRAFT",
    };
    if (body.extras) createData.extras = body.extras;

    const event = await (prisma.event.create as any)({ data: createData });

    res.status(201).json(wrapResponse(event));
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to create event", 500);
  }
});

apiRouter.put("/events/:eventId", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "events", "update");

    const { prisma } = await import("~/lib/db.server");
    const body = req.body;

    const existing = await (prisma.event.findFirst as any)({
      where: { id: req.params.eventId, tenantId: ctx.tenantId, deletedAt: null },
      includeDeleted: true,
    });
    if (!existing) return errorResponse(res, "NOT_FOUND", "Event not found", 404);

    // Optimistic locking via If-Match
    const ifMatch =
      typeof req.headers["if-match"] === "string" ? req.headers["if-match"] : undefined;
    if (ifMatch) {
      const expectedVersion = ifMatch.replace(/"/g, "");
      const currentVersion = String(new Date(existing.updatedAt).getTime());
      if (expectedVersion !== currentVersion) {
        return errorResponse(res, "CONFLICT", "Resource has been modified", 409);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.extras !== undefined) updateData.extras = body.extras;

    const event = await (prisma.event.update as any)({
      where: { id: req.params.eventId },
      data: updateData,
    });

    const etag = `"${new Date(event.updatedAt).getTime()}"`;
    res.setHeader("ETag", etag);

    res.json(wrapResponse(event));
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to update event", 500);
  }
});

apiRouter.delete("/events/:eventId", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "events", "delete");

    const { prisma } = await import("~/lib/db.server");

    const existing = await (prisma.event.findFirst as any)({
      where: { id: req.params.eventId, tenantId: ctx.tenantId, deletedAt: null },
      includeDeleted: true,
    });
    if (!existing) return errorResponse(res, "NOT_FOUND", "Event not found", 404);

    await (prisma.event.update as any)({
      where: { id: req.params.eventId },
      data: { deletedAt: new Date() },
    });

    res.status(204).end();
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to delete event", 500);
  }
});

// ─── Participants ─────────────────────────────────────────

apiRouter.get("/events/:eventId/participants", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "participants", "read");

    const { prisma } = await import("~/lib/db.server");
    const { page, pageSize, sort, sortDir, fields } = parsePagination(req);

    const where: Record<string, unknown> = {
      tenantId: ctx.tenantId,
      eventId: req.params.eventId,
      deletedAt: null,
    };
    const statusParam = queryString(req.query.status);
    if (statusParam) where.status = statusParam;
    const ptParam = queryString(req.query.participantTypeId);
    if (ptParam) where.participantTypeId = ptParam;

    const select = selectFields(fields) ?? {
      id: true,
      registrationCode: true,
      firstName: true,
      lastName: true,
      email: true,
      organization: true,
      nationality: true,
      status: true,
      participantTypeId: true,
      extras: true,
      createdAt: true,
      updatedAt: true,
    };

    const [items, total] = await Promise.all([
      prisma.participant.findMany({
        where,
        select,
        orderBy: sort ? { [sort]: sortDir } : { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        includeDeleted: true,
      } as any),
      prisma.participant.count({ where, includeDeleted: true } as any),
    ]);

    const totalNum = Number(total);
    res.json(
      wrapResponse(items, {
        page,
        pageSize,
        total: totalNum,
        totalPages: Math.ceil(totalNum / pageSize),
      }),
    );
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to list participants", 500);
  }
});

apiRouter.get("/events/:eventId/participants/:id", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "participants", "read");

    const { prisma } = await import("~/lib/db.server");

    const participant = await (prisma.participant.findFirst as any)({
      where: {
        id: req.params.id,
        tenantId: ctx.tenantId,
        eventId: req.params.eventId,
        deletedAt: null,
      },
      includeDeleted: true,
    });

    if (!participant) return errorResponse(res, "NOT_FOUND", "Participant not found", 404);
    res.json(wrapResponse(participant));
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to get participant", 500);
  }
});

apiRouter.post("/events/:eventId/participants", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "participants", "create");

    const { prisma } = await import("~/lib/db.server");
    const body = req.body;

    // Verify event belongs to tenant
    const event = await (prisma.event.findFirst as any)({
      where: { id: req.params.eventId, tenantId: ctx.tenantId, deletedAt: null },
      includeDeleted: true,
    });
    if (!event) return errorResponse(res, "NOT_FOUND", "Event not found", 404);

    if (!body.firstName || !body.lastName) {
      return errorResponse(res, "VALIDATION_ERROR", "firstName and lastName are required", 400);
    }
    if (!body.participantTypeId) {
      return errorResponse(res, "VALIDATION_ERROR", "participantTypeId is required", 400);
    }
    if (!body.workflowId) {
      return errorResponse(res, "VALIDATION_ERROR", "workflowId is required", 400);
    }
    if (!body.registrationCode) {
      return errorResponse(res, "VALIDATION_ERROR", "registrationCode is required", 400);
    }

    const createData: Record<string, unknown> = {
      tenantId: ctx.tenantId,
      eventId: req.params.eventId,
      participantTypeId: body.participantTypeId,
      workflowId: body.workflowId,
      registrationCode: body.registrationCode,
      firstName: body.firstName,
      lastName: body.lastName,
      status: body.status ?? "PENDING",
    };
    if (body.email) createData.email = body.email;
    if (body.organization) createData.organization = body.organization;
    if (body.jobTitle) createData.jobTitle = body.jobTitle;
    if (body.nationality) createData.nationality = body.nationality;
    if (body.extras) createData.extras = body.extras;

    const participant = await (prisma.participant.create as any)({ data: createData });

    res.status(201).json(wrapResponse(participant));
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to create participant", 500);
  }
});

apiRouter.put("/events/:eventId/participants/:id", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "participants", "update");

    const { prisma } = await import("~/lib/db.server");
    const body = req.body;

    const existing = await (prisma.participant.findFirst as any)({
      where: {
        id: req.params.id,
        tenantId: ctx.tenantId,
        eventId: req.params.eventId,
        deletedAt: null,
      },
      includeDeleted: true,
    });
    if (!existing) return errorResponse(res, "NOT_FOUND", "Participant not found", 404);

    const updateData: Record<string, unknown> = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.organization !== undefined) updateData.organization = body.organization;
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
    if (body.nationality !== undefined) updateData.nationality = body.nationality;
    if (body.participantTypeId !== undefined) updateData.participantTypeId = body.participantTypeId;
    if (body.extras !== undefined) updateData.extras = body.extras;
    if (body.status !== undefined) updateData.status = body.status;

    const participant = await (prisma.participant.update as any)({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(wrapResponse(participant));
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to update participant", 500);
  }
});

// ─── Workflows ────────────────────────────────────────────

apiRouter.get("/events/:eventId/workflows", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "workflows", "read");

    const { prisma } = await import("~/lib/db.server");
    const { page, pageSize } = parsePagination(req);

    const where = {
      tenantId: ctx.tenantId,
      eventId: req.params.eventId,
      deletedAt: null as null,
    };

    const [items, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        includeDeleted: true,
      } as any),
      prisma.workflow.count({ where, includeDeleted: true } as any),
    ]);

    const totalNum = Number(total);
    res.json(
      wrapResponse(items, {
        page,
        pageSize,
        total: totalNum,
        totalPages: Math.ceil(totalNum / pageSize),
      }),
    );
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to list workflows", 500);
  }
});

apiRouter.get("/events/:eventId/workflows/:id", async (req: Request, res: Response) => {
  try {
    const ctx = getApiContext(res);
    requireApiPermission(ctx.permissions, "workflows", "read");

    const { prisma } = await import("~/lib/db.server");

    const workflow = await (prisma.workflow.findFirst as any)({
      where: {
        id: req.params.id,
        tenantId: ctx.tenantId,
        eventId: req.params.eventId,
        deletedAt: null,
      },
      include: { steps: { orderBy: { order: "asc" } } },
      includeDeleted: true,
    });

    if (!workflow) return errorResponse(res, "NOT_FOUND", "Workflow not found", 404);
    res.json(wrapResponse(workflow));
  } catch (error: any) {
    if (error?.status === 403) return errorResponse(res, "FORBIDDEN", error.message, 403);
    errorResponse(res, "INTERNAL_ERROR", "Failed to get workflow", 500);
  }
});
