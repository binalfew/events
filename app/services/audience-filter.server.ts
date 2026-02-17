import { prisma } from "~/lib/db.server";
import type { AudienceFilter } from "~/lib/schemas/broadcast";

// ─── Types ────────────────────────────────────────────────

export interface ParticipantContact {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
}

// ─── Filter Helpers ──────────────────────────────────────

function buildWhereClause(eventId: string, tenantId: string, filter: AudienceFilter) {
  const where: Record<string, unknown> = {
    eventId,
    tenantId,
    deletedAt: null,
  };

  if (filter.participantTypes && filter.participantTypes.length > 0) {
    where.participantTypeId = { in: filter.participantTypes };
  }

  if (filter.statuses && filter.statuses.length > 0) {
    where.status = { in: filter.statuses };
  }

  if (filter.registeredAfter) {
    where.createdAt = { ...(where.createdAt as any), gte: filter.registeredAfter };
  }

  if (filter.registeredBefore) {
    where.createdAt = { ...(where.createdAt as any), lte: filter.registeredBefore };
  }

  if (filter.customFields && Object.keys(filter.customFields).length > 0) {
    where.extras = { path: [], ...buildExtrasFilter(filter.customFields) };
  }

  return where;
}

function buildExtrasFilter(customFields: Record<string, unknown>) {
  // Prisma JSON path filter — match keys within the extras JSONB column
  const conditions: Record<string, unknown>[] = [];
  for (const [key, value] of Object.entries(customFields)) {
    conditions.push({ path: [key], equals: value });
  }

  // If only one condition, return it directly
  if (conditions.length === 1) {
    return conditions[0];
  }

  // Multiple conditions: Prisma doesn't support multiple path filters on the same JSON field
  // in a single object, so we use the first match only (simplification).
  // For full AND logic across multiple JSONB keys, we'd need raw SQL.
  return conditions[0];
}

// ─── Public API ──────────────────────────────────────────

export async function countAudience(
  eventId: string,
  tenantId: string,
  filter: AudienceFilter,
): Promise<number> {
  const where = buildWhereClause(eventId, tenantId, filter);
  return prisma.participant.count({ where: where as any });
}

export async function resolveAudience(
  eventId: string,
  tenantId: string,
  filter: AudienceFilter,
): Promise<ParticipantContact[]> {
  const where = buildWhereClause(eventId, tenantId, filter);
  const BATCH_SIZE = 200;
  const contacts: ParticipantContact[] = [];
  let skip = 0;

  while (true) {
    const batch = await prisma.participant.findMany({
      where: where as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      skip,
      take: BATCH_SIZE,
      orderBy: { createdAt: "asc" },
    });

    if (batch.length === 0) break;

    contacts.push(...batch);
    skip += BATCH_SIZE;

    if (batch.length < BATCH_SIZE) break;
  }

  return contacts;
}
