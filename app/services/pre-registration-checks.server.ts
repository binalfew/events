import { screenAgainstBlacklist } from "~/services/blacklist.server";
import {
  runDuplicateDetection,
  classifyScore,
  scoreParticipantPair,
  findCandidatesInScope,
} from "~/services/duplicate-detection.server";
import type {
  ParticipantSnapshot,
  DuplicateRisk,
  MatchField,
} from "~/services/duplicate-detection.server";
import type { BlacklistMatch } from "~/services/blacklist.server";
import { logger } from "~/lib/logger.server";

// ─── Types ────────────────────────────────────────────────

export interface PreRegistrationResult {
  allowed: boolean;
  risk: DuplicateRisk;
  blacklistMatches: BlacklistMatch[];
  duplicateCandidates: Array<{
    participantId: string;
    score: number;
    matchFields: MatchField[];
    risk: DuplicateRisk;
  }>;
}

// ─── Orchestration ────────────────────────────────────────

export async function preRegistrationChecks(
  tenantId: string,
  eventId: string,
  participant: ParticipantSnapshot,
): Promise<PreRegistrationResult> {
  // Step 1: Screen against blacklist
  const blacklistMatches = await screenAgainstBlacklist(tenantId, {
    firstName: participant.firstName,
    lastName: participant.lastName,
    email: participant.email,
    extras: participant.extras,
  });

  if (blacklistMatches.length > 0) {
    logger.warn(
      { participantId: participant.id, blacklistMatches: blacklistMatches.length },
      "Blacklist match found during pre-registration check",
    );
    return {
      allowed: false,
      risk: "BLOCK",
      blacklistMatches,
      duplicateCandidates: [],
    };
  }

  // Step 2: Run duplicate detection (persists DuplicateCandidate records)
  await runDuplicateDetection(tenantId, eventId, participant);

  // Step 3: Score against candidates for immediate result
  const candidates = await findCandidatesInScope(tenantId, eventId, participant.id);
  const duplicateCandidates: PreRegistrationResult["duplicateCandidates"] = [];
  let highestRisk: DuplicateRisk = "PASS";

  for (const candidate of candidates) {
    const { score, matchFields } = scoreParticipantPair(participant, candidate);
    if (score < 0.7) continue;

    const risk = classifyScore(score);
    duplicateCandidates.push({
      participantId: candidate.id,
      score,
      matchFields,
      risk,
    });

    if (risk === "BLOCK") highestRisk = "BLOCK";
    else if (risk === "WARN" && highestRisk !== "BLOCK") highestRisk = "WARN";
  }

  return {
    allowed: highestRisk !== "BLOCK",
    risk: highestRisk,
    blacklistMatches: [],
    duplicateCandidates,
  };
}
