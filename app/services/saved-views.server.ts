import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { ViewType } from "~/generated/prisma/client.js";

// ─── Types ────────────────────────────────────────────────

export interface SavedViewFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface SavedViewSort {
  field: string;
  direction: "asc" | "desc";
}

export interface CreateViewInput {
  tenantId: string;
  userId: string;
  name: string;
  entityType: string;
  viewType?: ViewType;
  filters?: SavedViewFilter[];
  sorts?: SavedViewSort[];
  columns?: string[];
  config?: Record<string, unknown>;
  isShared?: boolean;
}

export interface UpdateViewInput {
  name?: string;
  viewType?: ViewType;
  filters?: SavedViewFilter[];
  sorts?: SavedViewSort[];
  columns?: string[];
  config?: Record<string, unknown>;
  isShared?: boolean;
  isDefault?: boolean;
}

export class SavedViewError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "SavedViewError";
  }
}

// ─── CRUD ─────────────────────────────────────────────────

export async function createView(input: CreateViewInput) {
  const view = await prisma.savedView.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      name: input.name,
      entityType: input.entityType,
      viewType: input.viewType ?? "TABLE",
      filters: (input.filters as object[]) ?? [],
      sorts: (input.sorts as object[]) ?? [],
      columns: input.columns ?? [],
      config: (input.config as object) ?? {},
      isShared: input.isShared ?? false,
    },
  });

  logger.info(
    { viewId: view.id, entityType: input.entityType, viewType: view.viewType },
    "Saved view created",
  );
  return view;
}

export async function updateView(viewId: string, userId: string, input: UpdateViewInput) {
  const view = await prisma.savedView.findUniqueOrThrow({
    where: { id: viewId },
  });

  // Only the owner or shared views' owner can update
  if (view.userId !== userId) {
    throw new SavedViewError("You can only update your own views", 403);
  }

  // If setting as default, unset other defaults for the same entity type
  if (input.isDefault) {
    await prisma.savedView.updateMany({
      where: {
        tenantId: view.tenantId,
        userId,
        entityType: view.entityType,
        isDefault: true,
        id: { not: viewId },
      },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.savedView.update({
    where: { id: viewId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.viewType !== undefined && { viewType: input.viewType }),
      ...(input.filters !== undefined && { filters: input.filters as object[] }),
      ...(input.sorts !== undefined && { sorts: input.sorts as object[] }),
      ...(input.columns !== undefined && { columns: input.columns }),
      ...(input.config !== undefined && { config: input.config as object }),
      ...(input.isShared !== undefined && { isShared: input.isShared }),
      ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
    },
  });

  logger.info({ viewId }, "Saved view updated");
  return updated;
}

export async function deleteView(viewId: string, userId: string) {
  const view = await prisma.savedView.findUniqueOrThrow({
    where: { id: viewId },
  });

  if (view.userId !== userId) {
    throw new SavedViewError("You can only delete your own views", 403);
  }

  await prisma.savedView.delete({ where: { id: viewId } });
  logger.info({ viewId }, "Saved view deleted");
}

export async function getView(viewId: string) {
  return prisma.savedView.findUniqueOrThrow({
    where: { id: viewId },
    include: { owner: { select: { id: true, name: true } } },
  });
}

/**
 * List views visible to the user for a given entity type.
 * Returns personal views (owned by user) + shared views (from other users in the tenant).
 */
export async function listViews(tenantId: string, userId: string, entityType: string) {
  return prisma.savedView.findMany({
    where: {
      tenantId,
      entityType,
      OR: [
        { userId }, // user's own views
        { isShared: true }, // shared views from any user in the tenant
      ],
    },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

/**
 * Get the user's default view for an entity type, or null.
 */
export async function getDefaultView(tenantId: string, userId: string, entityType: string) {
  return prisma.savedView.findFirst({
    where: {
      tenantId,
      userId,
      entityType,
      isDefault: true,
    },
  });
}

/**
 * Duplicate an existing view (creating a personal copy).
 */
export async function duplicateView(viewId: string, userId: string, tenantId: string) {
  const source = await prisma.savedView.findUniqueOrThrow({
    where: { id: viewId },
  });

  const copy = await prisma.savedView.create({
    data: {
      tenantId,
      userId,
      name: `${source.name} (copy)`,
      entityType: source.entityType,
      viewType: source.viewType,
      filters: source.filters ?? [],
      sorts: source.sorts ?? [],
      columns: source.columns ?? [],
      config: source.config ?? {},
      isShared: false,
      isDefault: false,
    },
  });

  logger.info({ sourceViewId: viewId, newViewId: copy.id }, "Saved view duplicated");
  return copy;
}
