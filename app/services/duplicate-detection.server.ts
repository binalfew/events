import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { levenshtein, soundex, normalizePhone } from "~/utils/levenshtein";

// ─── Types ────────────────────────────────────────────────

export interface ParticipantSnapshot {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  eventId: string;
  extras: Record<string, unknown>;
}

export interface MatchField {
  field: string;
  sourceValue: string;
  matchValue: string;
  score: number;
  matchType: string;
}

export type DuplicateRisk = "BLOCK" | "WARN" | "PASS";

interface ScoringResult {
  score: number;
  matchFields: MatchField[];
}

// ─── Pure scoring functions ───────────────────────────────

export function scoreParticipantPair(
  a: ParticipantSnapshot,
  b: ParticipantSnapshot,
): ScoringResult {
  const matchFields: MatchField[] = [];

  // L1: Exact identifier matches
  const passportA = String(a.extras?.passportNumber ?? "").trim();
  const passportB = String(b.extras?.passportNumber ?? "").trim();
  if (passportA && passportB && passportA.toLowerCase() === passportB.toLowerCase()) {
    matchFields.push({
      field: "passportNumber",
      sourceValue: passportA,
      matchValue: passportB,
      score: 1.0,
      matchType: "exact",
    });
  }

  if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) {
    matchFields.push({
      field: "email",
      sourceValue: a.email,
      matchValue: b.email,
      score: 0.95,
      matchType: "exact",
    });
  }

  const phoneA = normalizePhone(String(a.extras?.phone ?? ""));
  const phoneB = normalizePhone(String(b.extras?.phone ?? ""));
  if (phoneA && phoneB && phoneA === phoneB) {
    matchFields.push({
      field: "phone",
      sourceValue: phoneA,
      matchValue: phoneB,
      score: 0.9,
      matchType: "exact",
    });
  }

  // L2: Fuzzy name matching
  const fullA = `${a.firstName} ${a.lastName}`.toLowerCase();
  const fullB = `${b.firstName} ${b.lastName}`.toLowerCase();
  const nameDist = levenshtein(fullA, fullB);

  const dobA = String(a.extras?.dateOfBirth ?? "").trim();
  const dobB = String(b.extras?.dateOfBirth ?? "").trim();

  if (nameDist <= 2 && nameDist > 0) {
    // Name + DOB combo
    if (dobA && dobB && dobA === dobB) {
      matchFields.push({
        field: "name+dateOfBirth",
        sourceValue: `${fullA} (${dobA})`,
        matchValue: `${fullB} (${dobB})`,
        score: 0.9,
        matchType: "fuzzy+exact",
      });
    } else {
      matchFields.push({
        field: "name",
        sourceValue: fullA,
        matchValue: fullB,
        score: 0.85,
        matchType: "levenshtein",
      });
    }
  } else if (nameDist === 0) {
    // Exact name match
    if (dobA && dobB && dobA === dobB) {
      matchFields.push({
        field: "name+dateOfBirth",
        sourceValue: `${fullA} (${dobA})`,
        matchValue: `${fullB} (${dobB})`,
        score: 0.9,
        matchType: "exact+exact",
      });
    } else {
      matchFields.push({
        field: "name",
        sourceValue: fullA,
        matchValue: fullB,
        score: 0.85,
        matchType: "exact",
      });
    }
  } else {
    // Soundex fallback
    const soundexFirstA = soundex(a.firstName);
    const soundexFirstB = soundex(b.firstName);
    const soundexLastA = soundex(a.lastName);
    const soundexLastB = soundex(b.lastName);

    if (
      soundexFirstA &&
      soundexFirstB &&
      soundexLastA &&
      soundexLastB &&
      soundexFirstA === soundexFirstB &&
      soundexLastA === soundexLastB
    ) {
      matchFields.push({
        field: "name",
        sourceValue: fullA,
        matchValue: fullB,
        score: 0.8,
        matchType: "soundex",
      });
    }
  }

  if (matchFields.length === 0) {
    return { score: 0, matchFields: [] };
  }

  // L3: Cross-field boosting
  const baseScore = Math.max(...matchFields.map((f) => f.score));
  const additionalFields = matchFields.length - 1;
  const boost = Math.min(additionalFields * 0.05, 0.15);
  const finalScore = Math.min(baseScore + boost, 1.0);

  return { score: finalScore, matchFields };
}

// L4: Threshold classification
export function classifyScore(score: number): DuplicateRisk {
  if (score >= 0.9) return "BLOCK";
  if (score >= 0.7) return "WARN";
  return "PASS";
}

// ─── DB functions ─────────────────────────────────────────

export async function findCandidatesInScope(
  tenantId: string,
  eventId: string,
  excludeId?: string,
): Promise<ParticipantSnapshot[]> {
  // Find the current event to get date range
  const currentEvent = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, startDate: true, endDate: true },
  });

  if (!currentEvent) return [];

  // Find concurrent events (overlapping date ranges)
  const concurrentEventIds: string[] = [eventId];
  if (currentEvent.startDate && currentEvent.endDate) {
    const overlapping = await prisma.event.findMany({
      where: {
        tenantId,
        id: { not: eventId },
        startDate: { lte: currentEvent.endDate },
        endDate: { gte: currentEvent.startDate },
      },
      select: { id: true },
    });
    concurrentEventIds.push(...overlapping.map((e) => e.id));
  }

  const participants = await prisma.participant.findMany({
    where: {
      tenantId,
      eventId: { in: concurrentEventIds },
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      eventId: true,
      extras: true,
    },
  });

  return participants.map((p) => ({
    ...p,
    extras: (p.extras as Record<string, unknown>) ?? {},
  }));
}

export async function runDuplicateDetection(
  tenantId: string,
  eventId: string,
  participant: ParticipantSnapshot,
): Promise<void> {
  const candidates = await findCandidatesInScope(tenantId, eventId, participant.id);

  for (const candidate of candidates) {
    const { score, matchFields } = scoreParticipantPair(participant, candidate);

    if (score < 0.7) continue;

    // Ensure consistent ordering: min(id1, id2) = participantAId
    const [participantAId, participantBId] =
      participant.id < candidate.id
        ? [participant.id, candidate.id]
        : [candidate.id, participant.id];

    await prisma.duplicateCandidate.upsert({
      where: {
        participantAId_participantBId: { participantAId, participantBId },
      },
      create: {
        tenantId,
        eventId,
        participantAId,
        participantBId,
        confidenceScore: score,
        matchFields: matchFields as any,
        status: "PENDING_REVIEW",
      },
      update: {
        confidenceScore: score,
        matchFields: matchFields as any,
      },
    });
  }

  logger.info({ participantId: participant.id, eventId }, "Duplicate detection completed");
}
