import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { CreateSurveyInput, SubmitResponseInput } from "~/lib/schemas/survey";

// ─── Types ────────────────────────────────────────────────

export class SurveyError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "SurveyError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Survey CRUD ────────────────────────────────────────

export async function createSurvey(input: CreateSurveyInput, ctx: ServiceContext) {
  const survey = await prisma.survey.create({
    data: {
      tenantId: ctx.tenantId,
      eventId: input.eventId,
      title: input.title,
      description: input.description ?? null,
      formTemplateId: input.formTemplateId ?? null,
      opensAt: input.opensAt ? new Date(input.opensAt) : null,
      closesAt: input.closesAt ? new Date(input.closesAt) : null,
      isAnonymous: input.isAnonymous ?? false,
      createdBy: ctx.userId,
      status: "DRAFT",
    },
  });

  logger.info({ surveyId: survey.id }, "Survey created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Survey",
      entityId: survey.id,
      description: `Created survey "${input.title}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return survey;
}

export async function listSurveys(eventId: string, tenantId: string) {
  return prisma.survey.findMany({
    where: { eventId, tenantId },
    include: {
      formTemplate: { select: { id: true, name: true } },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSurvey(surveyId: string, tenantId: string) {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, tenantId },
    include: {
      formTemplate: { select: { id: true, name: true, definition: true } },
      _count: { select: { responses: true } },
    },
  });
  if (!survey) {
    throw new SurveyError("Survey not found", 404);
  }
  return survey;
}

// ─── Survey Lifecycle ───────────────────────────────────

export async function publishSurvey(surveyId: string, ctx: ServiceContext) {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, tenantId: ctx.tenantId },
  });
  if (!survey) {
    throw new SurveyError("Survey not found", 404);
  }
  if (survey.status !== "DRAFT") {
    throw new SurveyError(`Cannot publish survey with status ${survey.status}`, 400);
  }

  const updated = await prisma.survey.update({
    where: { id: surveyId },
    data: { status: "PUBLISHED" },
  });

  logger.info({ surveyId }, "Survey published");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Survey",
      entityId: surveyId,
      description: "Published survey",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

export async function closeSurvey(surveyId: string, ctx: ServiceContext) {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, tenantId: ctx.tenantId },
  });
  if (!survey) {
    throw new SurveyError("Survey not found", 404);
  }
  if (survey.status !== "PUBLISHED") {
    throw new SurveyError(`Cannot close survey with status ${survey.status}`, 400);
  }

  const updated = await prisma.survey.update({
    where: { id: surveyId },
    data: { status: "CLOSED" },
  });

  logger.info({ surveyId }, "Survey closed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "Survey",
      entityId: surveyId,
      description: "Closed survey",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return updated;
}

export async function archiveSurvey(surveyId: string, ctx: ServiceContext) {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, tenantId: ctx.tenantId },
  });
  if (!survey) {
    throw new SurveyError("Survey not found", 404);
  }
  if (survey.status !== "CLOSED") {
    throw new SurveyError(`Cannot archive survey with status ${survey.status}`, 400);
  }

  const updated = await prisma.survey.update({
    where: { id: surveyId },
    data: { status: "ARCHIVED" },
  });

  logger.info({ surveyId }, "Survey archived");

  return updated;
}

// ─── Response Submission ────────────────────────────────

export async function submitResponse(input: SubmitResponseInput, ctx: ServiceContext) {
  const survey = await prisma.survey.findFirst({
    where: { id: input.surveyId, tenantId: ctx.tenantId },
  });
  if (!survey) {
    throw new SurveyError("Survey not found", 404);
  }
  if (survey.status !== "PUBLISHED") {
    throw new SurveyError("Survey is not accepting responses", 400);
  }

  // Check open/close window
  const now = new Date();
  if (survey.opensAt && now < survey.opensAt) {
    throw new SurveyError("Survey has not opened yet", 400);
  }
  if (survey.closesAt && now > survey.closesAt) {
    throw new SurveyError("Survey has closed", 400);
  }

  // Check for duplicate response
  if (input.participantId) {
    const existing = await prisma.surveyResponse.findFirst({
      where: { surveyId: input.surveyId, participantId: input.participantId },
    });
    if (existing) {
      throw new SurveyError("Participant has already submitted a response", 409);
    }
  }

  let answers: any;
  try {
    answers = JSON.parse(input.answers);
  } catch {
    throw new SurveyError("Invalid answers format", 400);
  }

  const response = await prisma.surveyResponse.create({
    data: {
      surveyId: input.surveyId,
      participantId: input.participantId ?? null,
      answers,
    },
    include: {
      participant: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  logger.info({ surveyId: input.surveyId, responseId: response.id }, "Survey response submitted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "SurveyResponse",
      entityId: response.id,
      description: `Submitted response for survey "${survey.title}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });

  return response;
}

// ─── Response Queries ───────────────────────────────────

export async function getResponses(
  surveyId: string,
  tenantId: string,
  filters?: { page?: number; pageSize?: number },
) {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, tenantId },
  });
  if (!survey) {
    throw new SurveyError("Survey not found", 404);
  }

  const [responses, total] = await Promise.all([
    prisma.surveyResponse.findMany({
      where: { surveyId },
      include: {
        participant: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.surveyResponse.count({ where: { surveyId } }),
  ]);

  return { responses, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getSurveyAnalytics(surveyId: string, tenantId: string) {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, tenantId },
    include: {
      formTemplate: { select: { definition: true } },
      _count: { select: { responses: true } },
    },
  });
  if (!survey) {
    throw new SurveyError("Survey not found", 404);
  }

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId },
    select: { answers: true },
  });

  // Aggregate answers by question key
  const questionStats: Record<string, { values: any[]; type?: string }> = {};
  for (const r of responses) {
    const answers = r.answers as Record<string, any>;
    for (const [key, value] of Object.entries(answers)) {
      if (!questionStats[key]) {
        questionStats[key] = { values: [] };
      }
      questionStats[key].values.push(value);
    }
  }

  // Compute stats per question
  const breakdown: Record<string, any> = {};
  for (const [key, stat] of Object.entries(questionStats)) {
    const numericValues = stat.values.filter((v) => typeof v === "number");
    if (numericValues.length > 0) {
      breakdown[key] = {
        type: "numeric",
        count: numericValues.length,
        average:
          Math.round((numericValues.reduce((a, b) => a + b, 0) / numericValues.length) * 100) / 100,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
      };
    } else {
      // Count occurrences for categorical data
      const counts: Record<string, number> = {};
      for (const v of stat.values) {
        const str = String(v);
        counts[str] = (counts[str] || 0) + 1;
      }
      breakdown[key] = {
        type: "categorical",
        count: stat.values.length,
        distribution: counts,
      };
    }
  }

  return {
    surveyId,
    title: survey.title,
    totalResponses: survey._count.responses,
    breakdown,
  };
}

export async function exportSurveyResults(surveyId: string, tenantId: string) {
  const survey = await prisma.survey.findFirst({
    where: { id: surveyId, tenantId },
  });
  if (!survey) {
    throw new SurveyError("Survey not found", 404);
  }

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId },
    include: {
      participant: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  // Collect all answer keys
  const allKeys = new Set<string>();
  for (const r of responses) {
    const answers = r.answers as Record<string, any>;
    for (const key of Object.keys(answers)) {
      allKeys.add(key);
    }
  }

  const headers = ["Response ID", "Participant", "Email", "Submitted At", ...Array.from(allKeys)];

  const rows = responses.map((r) => {
    const answers = r.answers as Record<string, any>;
    return [
      r.id,
      r.participant ? `${r.participant.firstName} ${r.participant.lastName}` : "Anonymous",
      r.participant?.email ?? "",
      r.submittedAt.toISOString(),
      ...Array.from(allKeys).map((key) => String(answers[key] ?? "")),
    ];
  });

  // Build CSV
  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ];

  return {
    csv: csvLines.join("\n"),
    filename: `survey-${surveyId}-results.csv`,
    totalRows: rows.length,
  };
}
