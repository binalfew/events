import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { CreateSeriesInput, AddEditionInput } from "~/lib/schemas/event-series";

// ─── Types ────────────────────────────────────────────────

export class EventSeriesError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "EventSeriesError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Series CRUD ────────────────────────────────────────

export async function createSeries(input: CreateSeriesInput, ctx: ServiceContext) {
  const series = await prisma.eventSeries.create({
    data: {
      tenantId: ctx.tenantId,
      name: input.name,
      description: input.description ?? null,
    },
  });

  logger.info({ seriesId: series.id }, "Event series created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "EventSeries",
      entityId: series.id,
      description: `Created event series "${input.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return series;
}

export async function listSeries(tenantId: string) {
  return prisma.eventSeries.findMany({
    where: { tenantId },
    include: {
      editions: {
        include: {
          event: { select: { id: true, name: true, startDate: true, endDate: true, status: true } },
        },
        orderBy: { year: "desc" },
      },
      _count: { select: { editions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSeries(seriesId: string, tenantId: string) {
  const series = await prisma.eventSeries.findFirst({
    where: { id: seriesId, tenantId },
    include: {
      editions: {
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
        },
        orderBy: { year: "asc" },
      },
    },
  });
  if (!series) {
    throw new EventSeriesError("Series not found", 404);
  }
  return series;
}

export async function addEdition(input: AddEditionInput, ctx: ServiceContext) {
  const series = await prisma.eventSeries.findFirst({
    where: { id: input.seriesId, tenantId: ctx.tenantId },
  });
  if (!series) {
    throw new EventSeriesError("Series not found", 404);
  }

  const edition = await prisma.eventEdition.create({
    data: {
      seriesId: input.seriesId,
      eventId: input.eventId,
      editionNumber: input.editionNumber,
      year: input.year,
      hostCountry: input.hostCountry ?? null,
      hostCity: input.hostCity ?? null,
      notes: input.notes ?? null,
    },
    include: {
      event: { select: { id: true, name: true } },
    },
  });

  logger.info({ editionId: edition.id, seriesId: input.seriesId }, "Edition added to series");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "EventEdition",
      entityId: edition.id,
      description: `Added edition #${input.editionNumber} (${input.year}) to series "${series.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return edition;
}

export async function removeEdition(editionId: string, ctx: ServiceContext) {
  const edition = await prisma.eventEdition.findFirst({
    where: { id: editionId },
    include: { series: { select: { tenantId: true } } },
  });
  if (!edition || edition.series.tenantId !== ctx.tenantId) {
    throw new EventSeriesError("Edition not found", 404);
  }

  await prisma.eventEdition.delete({ where: { id: editionId } });

  logger.info({ editionId }, "Edition removed from series");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "EventEdition",
      entityId: editionId,
      description: "Removed edition from series",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return { success: true };
}

// ─── YoY Analytics ──────────────────────────────────────

export async function getYoYComparison(seriesId: string, tenantId: string) {
  const series = await prisma.eventSeries.findFirst({
    where: { id: seriesId, tenantId },
    include: {
      editions: {
        include: { event: { select: { id: true, name: true } } },
        orderBy: { year: "asc" },
      },
    },
  });
  if (!series) {
    throw new EventSeriesError("Series not found", 404);
  }

  const editionMetrics = [];

  for (const edition of series.editions) {
    const eventId = edition.eventId;

    const [participants, accessLogs, accommodations, surveyResponses] = await Promise.all([
      prisma.participant.findMany({
        where: { eventId, tenantId, deletedAt: null },
        select: { status: true, createdAt: true, updatedAt: true },
      }),
      prisma.accessLog.findMany({
        where: { checkpoint: { eventId } },
        select: { scanResult: true },
      }),
      prisma.accommodationAssignment.findMany({
        where: { eventId, tenantId },
        select: { status: true },
      }),
      prisma.surveyResponse.findMany({
        where: { survey: { eventId, tenantId } },
        select: { answers: true },
      }),
    ]);

    // Registration metrics
    const regByStatus: Record<string, number> = {};
    for (const p of participants) {
      regByStatus[p.status] = (regByStatus[p.status] || 0) + 1;
    }

    // Processing time (avg days from creation to last update for approved)
    const approved = participants.filter((p) => p.status === "APPROVED");
    const avgProcessingDays =
      approved.length > 0
        ? Math.round(
            approved.reduce(
              (sum, p) => sum + (p.updatedAt.getTime() - p.createdAt.getTime()) / 86400000,
              0,
            ) / approved.length,
          )
        : 0;

    // Check-in rate
    const checkIns = accessLogs.filter((l) => l.scanResult === "VALID").length;
    const checkInRate =
      participants.length > 0 ? Math.round((checkIns / participants.length) * 100) : 0;

    // Accommodation utilization
    const accommCheckedIn = accommodations.filter((a) => a.status === "CHECKED_IN").length;
    const accommTotal = accommodations.length;

    // Survey satisfaction (average of numeric answers named "rating" or "satisfaction")
    let ratingSum = 0;
    let ratingCount = 0;
    for (const r of surveyResponses) {
      const answers = r.answers as Record<string, any>;
      for (const [key, value] of Object.entries(answers)) {
        if (
          (key.toLowerCase().includes("rating") || key.toLowerCase().includes("satisfaction")) &&
          typeof value === "number"
        ) {
          ratingSum += value;
          ratingCount++;
        }
      }
    }
    const avgSatisfaction =
      ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : null;

    editionMetrics.push({
      editionId: edition.id,
      editionNumber: edition.editionNumber,
      year: edition.year,
      eventName: edition.event.name,
      registration: {
        total: participants.length,
        approved: regByStatus["APPROVED"] || 0,
        pending: regByStatus["PENDING"] || 0,
        rejected: regByStatus["REJECTED"] || 0,
      },
      avgProcessingDays,
      checkInRate,
      accommodation: {
        total: accommTotal,
        checkedIn: accommCheckedIn,
        utilization: accommTotal > 0 ? Math.round((accommCheckedIn / accommTotal) * 100) : 0,
      },
      avgSatisfaction,
      surveyResponses: surveyResponses.length,
    });
  }

  return { seriesId, seriesName: series.name, editions: editionMetrics };
}

export async function getEditionTrends(seriesId: string, tenantId: string) {
  const comparison = await getYoYComparison(seriesId, tenantId);

  const trends = {
    years: comparison.editions.map((e) => e.year),
    registrations: comparison.editions.map((e) => e.registration.total),
    approvals: comparison.editions.map((e) => e.registration.approved),
    checkInRates: comparison.editions.map((e) => e.checkInRate),
    processingDays: comparison.editions.map((e) => e.avgProcessingDays),
    satisfaction: comparison.editions.map((e) => e.avgSatisfaction),
    accommodationUtilization: comparison.editions.map((e) => e.accommodation.utilization),
  };

  return { seriesName: comparison.seriesName, trends };
}

// ─── Returning Participants ─────────────────────────────

export async function identifyReturningParticipants(
  sourceEditionId: string,
  targetEditionId: string,
) {
  const [sourceEdition, targetEdition] = await Promise.all([
    prisma.eventEdition.findFirst({
      where: { id: sourceEditionId },
      select: { eventId: true },
    }),
    prisma.eventEdition.findFirst({
      where: { id: targetEditionId },
      select: { eventId: true },
    }),
  ]);

  if (!sourceEdition) throw new EventSeriesError("Source edition not found", 404);
  if (!targetEdition) throw new EventSeriesError("Target edition not found", 404);

  const [sourceParticipants, targetParticipants] = await Promise.all([
    prisma.participant.findMany({
      where: { eventId: sourceEdition.eventId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, organization: true },
    }),
    prisma.participant.findMany({
      where: { eventId: targetEdition.eventId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, organization: true },
    }),
  ]);

  // Match by email
  const targetEmails = new Set(
    targetParticipants.filter((p) => p.email).map((p) => p.email!.toLowerCase()),
  );

  const returning = sourceParticipants.filter(
    (p) => p.email && targetEmails.has(p.email.toLowerCase()),
  );
  const newParticipants = targetParticipants.filter(
    (p) =>
      !p.email ||
      !sourceParticipants.some(
        (sp) => sp.email && sp.email.toLowerCase() === p.email!.toLowerCase(),
      ),
  );

  return {
    returning: returning.map((p) => ({
      sourceId: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      organization: p.organization,
    })),
    returningCount: returning.length,
    newCount: newParticipants.length,
    sourceTotal: sourceParticipants.length,
    targetTotal: targetParticipants.length,
  };
}

export async function generateCarryForwardData(participantId: string, tenantId: string) {
  const participant = await prisma.participant.findFirst({
    where: { id: participantId, tenantId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      organization: true,
      jobTitle: true,
      nationality: true,
      extras: true,
      participantType: { select: { id: true, name: true, code: true } },
    },
  });
  if (!participant) {
    throw new EventSeriesError("Participant not found", 404);
  }

  return {
    firstName: participant.firstName,
    lastName: participant.lastName,
    email: participant.email,
    organization: participant.organization,
    jobTitle: participant.jobTitle,
    nationality: participant.nationality,
    participantTypeCode: participant.participantType?.code,
    extras: participant.extras,
  };
}
