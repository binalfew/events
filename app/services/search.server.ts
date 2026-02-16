import { prisma } from "~/lib/db.server";

// ─── Types ───────────────────────────────────────────────

interface SearchOptions {
  limit?: number;
}

interface ParticipantResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  organization: string | null;
  registrationCode: string;
  status: string;
  eventName: string;
  participantTypeName: string;
}

interface EventResult {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface FormResult {
  id: string;
  name: string;
  eventName: string;
  version: number;
  isActive: boolean;
}

export interface SearchResults {
  participants: ParticipantResult[];
  events: EventResult[];
  forms: FormResult[];
}

// ─── Service Function ───────────────────────────────────

export async function globalSearch(
  query: string,
  tenantId: string,
  options?: SearchOptions,
): Promise<SearchResults> {
  const limit = options?.limit ?? 5;

  const [participants, events, forms] = await Promise.all([
    prisma.participant.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { organization: { contains: query, mode: "insensitive" } },
          { registrationCode: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        event: { select: { name: true } },
        participantType: { select: { name: true } },
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),

    prisma.event.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),

    prisma.formTemplate.findMany({
      where: {
        tenantId,
        name: { contains: query, mode: "insensitive" },
      },
      include: {
        event: { select: { name: true } },
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    participants: participants.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      organization: p.organization,
      registrationCode: p.registrationCode,
      status: p.status,
      eventName: p.event.name,
      participantTypeName: p.participantType.name,
    })),
    events: events.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      status: e.status,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
    })),
    forms: forms.map((f) => ({
      id: f.id,
      name: f.name,
      eventName: f.event.name,
      version: f.version,
      isActive: f.isActive,
    })),
  };
}
