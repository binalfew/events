import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type {
  CreateGiftItemInput,
  CreateWelcomePackageInput,
  AssignPackageInput,
} from "~/lib/schemas/gift-protocol";

// ─── Types ────────────────────────────────────────────────

export class GiftError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "GiftError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Gift Item Functions ──────────────────────────────────

export async function createGiftItem(input: CreateGiftItemInput, ctx: ServiceContext) {
  const item = await prisma.giftItem.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      value: input.value ?? null,
      currency: input.currency,
      quantity: input.quantity,
      imageUrl: input.imageUrl ?? null,
    },
  });

  logger.info({ itemId: item.id }, "Gift item created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "GiftItem",
      entityId: item.id,
      description: `Created gift item "${input.name}" (qty: ${input.quantity})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { category: input.category, quantity: input.quantity },
    },
  });

  return item;
}

export async function listGiftItems(eventId: string, tenantId: string) {
  return prisma.giftItem.findMany({
    where: { eventId, tenantId },
    include: { _count: { select: { deliveries: true } } },
    orderBy: { name: "asc" },
  });
}

export async function updateStock(itemId: string, quantity: number, ctx: ServiceContext) {
  const item = await prisma.giftItem.findFirst({
    where: { id: itemId, tenantId: ctx.tenantId },
  });
  if (!item) {
    throw new GiftError("Gift item not found", 404);
  }

  const newQuantity = item.quantity + quantity;
  if (newQuantity < 0) {
    throw new GiftError("Cannot reduce stock below zero", 400);
  }

  const updated = await prisma.giftItem.update({
    where: { id: itemId },
    data: { quantity: newQuantity },
  });

  logger.info({ itemId, adjustment: quantity, newQuantity }, "Gift stock updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "GiftItem",
      entityId: itemId,
      description: `Adjusted stock by ${quantity >= 0 ? "+" : ""}${quantity} (now ${newQuantity})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { adjustment: quantity, newQuantity },
    },
  });

  return updated;
}

// ─── Welcome Package Functions ────────────────────────────

export async function createWelcomePackage(input: CreateWelcomePackageInput, ctx: ServiceContext) {
  let contents: any[];
  try {
    contents = JSON.parse(input.contents);
  } catch {
    contents = [];
  }

  const pkg = await prisma.welcomePackage.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      name: input.name,
      forParticipantType: input.forParticipantType ?? null,
      contents,
    },
  });

  logger.info({ packageId: pkg.id }, "Welcome package created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "WelcomePackage",
      entityId: pkg.id,
      description: `Created welcome package "${input.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { forParticipantType: input.forParticipantType },
    },
  });

  return pkg;
}

export async function listWelcomePackages(eventId: string, tenantId: string) {
  return prisma.welcomePackage.findMany({
    where: { eventId, tenantId },
    include: { _count: { select: { deliveries: true } } },
    orderBy: { name: "asc" },
  });
}

// ─── Delivery Functions ───────────────────────────────────

export async function assignPackage(
  input: AssignPackageInput,
  eventId: string,
  ctx: ServiceContext,
) {
  const delivery = await prisma.giftDelivery.create({
    data: {
      tenantId: ctx.tenantId,
      eventId,
      participantId: input.participantId,
      welcomePackageId: input.welcomePackageId ?? null,
      giftItemId: input.giftItemId ?? null,
      recipientName: input.recipientName,
      notes: input.notes ?? null,
    },
    include: {
      participant: { select: { id: true, firstName: true, lastName: true } },
      welcomePackage: { select: { id: true, name: true } },
      giftItem: { select: { id: true, name: true } },
    },
  });

  // Increment allocated count on gift item if assigned
  if (input.giftItemId) {
    await prisma.giftItem.update({
      where: { id: input.giftItemId },
      data: { allocated: { increment: 1 } },
    });
  }

  logger.info({ deliveryId: delivery.id }, "Package assigned");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "GiftDelivery",
      entityId: delivery.id,
      description: `Assigned package to ${input.recipientName}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return delivery;
}

export async function bulkAssignPackages(eventId: string, tenantId: string, ctx: ServiceContext) {
  // Get packages with participant type eligibility
  const packages = await prisma.welcomePackage.findMany({
    where: { eventId, tenantId },
  });

  // Get participants without a delivery for this event
  const existingDeliveries = await prisma.giftDelivery.findMany({
    where: { eventId, tenantId },
    select: { participantId: true },
  });
  const assignedIds = new Set(existingDeliveries.map((d) => d.participantId));

  const participants = await prisma.participant.findMany({
    where: {
      eventId,
      tenantId,
      status: "APPROVED",
      id: { notIn: [...assignedIds].filter(Boolean) as string[] },
    },
    include: { participantType: { select: { id: true, name: true } } },
  });

  let assignedCount = 0;

  for (const participant of participants) {
    // Find matching package by participant type
    const matchingPkg = packages.find(
      (p) =>
        p.forParticipantType === participant.participantType?.name ||
        p.forParticipantType === participant.participantType?.id ||
        !p.forParticipantType,
    );

    if (matchingPkg) {
      await prisma.giftDelivery.create({
        data: {
          tenantId,
          eventId,
          participantId: participant.id,
          welcomePackageId: matchingPkg.id,
          recipientName: `${participant.firstName} ${participant.lastName}`,
        },
      });
      assignedCount++;
    }
  }

  logger.info({ eventId, assignedCount }, "Bulk package assignment completed");

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "GiftDelivery",
      entityId: eventId,
      description: `Bulk assigned ${assignedCount} packages`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { assignedCount },
    },
  });

  return { assigned: assignedCount };
}

export async function markAssembled(deliveryId: string, ctx: ServiceContext) {
  const delivery = await prisma.giftDelivery.findFirst({
    where: { id: deliveryId, tenantId: ctx.tenantId },
  });
  if (!delivery) {
    throw new GiftError("Delivery not found", 404);
  }
  if (delivery.status !== "PENDING") {
    throw new GiftError(`Cannot mark as assembled from status ${delivery.status}`, 400);
  }

  const updated = await prisma.giftDelivery.update({
    where: { id: deliveryId },
    data: { status: "ASSEMBLED" },
  });

  logger.info({ deliveryId }, "Delivery marked as assembled");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "GiftDelivery",
      entityId: deliveryId,
      description: "Marked delivery as assembled",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

export async function markDelivered(deliveryId: string, ctx: ServiceContext) {
  const delivery = await prisma.giftDelivery.findFirst({
    where: { id: deliveryId, tenantId: ctx.tenantId },
  });
  if (!delivery) {
    throw new GiftError("Delivery not found", 404);
  }
  if (delivery.status !== "ASSEMBLED") {
    throw new GiftError(`Cannot mark as delivered from status ${delivery.status}`, 400);
  }

  const updated = await prisma.giftDelivery.update({
    where: { id: deliveryId },
    data: {
      status: "DELIVERED",
      deliveredAt: new Date(),
      deliveredBy: ctx.userId,
    },
  });

  logger.info({ deliveryId }, "Delivery marked as delivered");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "GiftDelivery",
      entityId: deliveryId,
      description: "Marked delivery as delivered",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

// ─── Dashboard ────────────────────────────────────────────

export async function getDeliveryDashboard(eventId: string, tenantId: string) {
  const [deliveries, items, packages] = await Promise.all([
    prisma.giftDelivery.findMany({
      where: { eventId, tenantId },
      select: { status: true },
    }),
    prisma.giftItem.findMany({
      where: { eventId, tenantId },
      select: { quantity: true, allocated: true },
    }),
    prisma.welcomePackage.count({ where: { eventId, tenantId } }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const d of deliveries) {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
  }

  const totalStock = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAllocated = items.reduce((sum, i) => sum + i.allocated, 0);

  return {
    totalDeliveries: deliveries.length,
    pending: byStatus["PENDING"] || 0,
    assembled: byStatus["ASSEMBLED"] || 0,
    delivered: byStatus["DELIVERED"] || 0,
    returned: byStatus["RETURNED"] || 0,
    completionRate:
      deliveries.length > 0
        ? Math.round(((byStatus["DELIVERED"] || 0) / deliveries.length) * 100)
        : 0,
    totalItems: items.length,
    totalStock,
    totalAllocated,
    packages,
  };
}

export async function listDeliveries(eventId: string, tenantId: string, status?: string) {
  const where: any = { eventId, tenantId };
  if (status) where.status = status;

  return prisma.giftDelivery.findMany({
    where,
    include: {
      participant: { select: { id: true, firstName: true, lastName: true } },
      welcomePackage: { select: { id: true, name: true } },
      giftItem: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
