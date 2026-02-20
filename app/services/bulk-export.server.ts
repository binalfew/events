import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { getEffectiveFields } from "./fields.server";

// ─── Constants ───────────────────────────────────────────

const MAX_EXPORT_ROWS = 10_000;
const UTF8_BOM = "\uFEFF";

// ─── Types ───────────────────────────────────────────────

export interface ExportFilters {
  status?: string;
  participantTypeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ─── CSV escaping ────────────────────────────────────────

function escapeCsvField(value: unknown): string {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

// ─── Export participants ─────────────────────────────────

export async function exportParticipants(
  eventId: string,
  tenantId: string,
  filters: ExportFilters = {},
  fields: string[] = [],
): Promise<string> {
  // Build where clause
  const where: Record<string, unknown> = {
    tenantId,
    eventId,
    deletedAt: null,
  };
  if (filters.status) where.status = filters.status;
  if (filters.participantTypeId) where.participantTypeId = filters.participantTypeId;
  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) createdAt.gte = filters.dateFrom;
    if (filters.dateTo) createdAt.lte = filters.dateTo;
    where.createdAt = createdAt;
  }

  const participants = await prisma.participant.findMany({
    where,
    include: {
      participantType: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_EXPORT_ROWS,
  });

  // Fixed fields available for export
  const fixedFieldMap: Record<string, (p: any) => string> = {
    firstName: (p) => p.firstName,
    lastName: (p) => p.lastName,
    email: (p) => p.email ?? "",
    organization: (p) => p.organization ?? "",
    jobTitle: (p) => p.jobTitle ?? "",
    nationality: (p) => p.nationality ?? "",
    registrationCode: (p) => p.registrationCode,
    status: (p) => p.status,
    participantType: (p) => p.participantType?.name ?? "",
    createdAt: (p) => (p.createdAt ? new Date(p.createdAt).toISOString() : ""),
  };

  // If no fields specified, export all fixed fields
  const allFixedFields = Object.keys(fixedFieldMap);
  const selectedFixed = fields.length > 0 ? fields.filter((f) => fixedFieldMap[f]) : allFixedFields;

  // Get dynamic field definitions for this event (includes global + event-specific)
  const fieldDefs = await getEffectiveFields(tenantId, eventId, "Participant");

  const selectedDynamic =
    fields.length > 0 ? fieldDefs.filter((fd) => fields.includes(fd.name)) : fieldDefs;

  // Build headers
  const headers = [
    ...selectedFixed.map((f) => {
      // Use friendly labels
      const labelMap: Record<string, string> = {
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        organization: "Organization",
        jobTitle: "Job Title",
        nationality: "Nationality",
        registrationCode: "Registration Code",
        status: "Status",
        participantType: "Participant Type",
        createdAt: "Created At",
      };
      return labelMap[f] ?? f;
    }),
    ...selectedDynamic.map((fd) => fd.label),
  ];

  // Build rows
  const rows = participants.map((p) => {
    const fixedValues = selectedFixed.map((f) => fixedFieldMap[f]?.(p) ?? "");
    const extras = (p.extras as Record<string, unknown>) ?? {};
    const dynamicValues = selectedDynamic.map((fd) => String(extras[fd.name] ?? ""));
    return [...fixedValues, ...dynamicValues];
  });

  // Generate CSV
  const csvLines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvField(cell)).join(","),
  );

  logger.info(
    { eventId, rowCount: participants.length, fieldCount: headers.length },
    "Participant export generated",
  );

  return UTF8_BOM + csvLines.join("\n");
}
