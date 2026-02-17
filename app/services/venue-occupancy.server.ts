import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";

// ─── Types ────────────────────────────────────────────────

export interface OccupancyRecord {
  id: string;
  eventId: string;
  zoneId: string | null;
  currentCount: number;
  maxCapacity: number;
  lastUpdated: Date;
}

// ─── Service Functions ────────────────────────────────────

/**
 * Get all occupancy records for an event.
 */
export async function getEventOccupancy(eventId: string): Promise<OccupancyRecord[]> {
  return prisma.venueOccupancy.findMany({
    where: { eventId },
    orderBy: { zoneId: "asc" },
  });
}

/**
 * Atomically increment or decrement occupancy for a zone.
 * Direction: "entry" increments, "exit" decrements.
 * Returns the updated record.
 */
export async function updateOccupancy(
  eventId: string,
  direction: "entry" | "exit",
  zoneId?: string | null,
): Promise<OccupancyRecord | null> {
  const record = await prisma.venueOccupancy.findFirst({
    where: { eventId, zoneId: zoneId ?? null },
  });

  if (!record) {
    logger.warn({ eventId, zoneId }, "No occupancy record found for zone");
    return null;
  }

  const increment = direction === "entry" ? 1 : -1;
  const newCount = Math.max(0, record.currentCount + increment);

  const updated = await prisma.venueOccupancy.update({
    where: { id: record.id },
    data: {
      currentCount: newCount,
      lastUpdated: new Date(),
    },
  });

  logger.info(
    { eventId, zoneId, direction, currentCount: updated.currentCount },
    "Occupancy updated",
  );

  return updated;
}
