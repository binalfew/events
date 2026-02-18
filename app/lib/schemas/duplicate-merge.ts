import { z } from "zod/v4";

const BLACKLIST_TYPES = ["INDIVIDUAL", "ORGANIZATION", "DOCUMENT"] as const;

export const createBlacklistSchema = z.object({
  type: z.enum(BLACKLIST_TYPES),
  name: z.string().max(200).optional(),
  nameVariations: z.string().max(2000).optional(),
  passportNumber: z.string().max(100).optional(),
  email: z.string().email().max(200).optional(),
  reason: z.string().min(1, "Reason is required").max(1000),
  source: z.string().max(200).optional(),
  expiresAt: z.coerce.date().optional(),
});

export type CreateBlacklistInput = z.infer<typeof createBlacklistSchema>;

export const updateBlacklistSchema = createBlacklistSchema.partial();
export type UpdateBlacklistInput = z.infer<typeof updateBlacklistSchema>;

export const mergeParticipantsSchema = z.object({
  survivingId: z.string().min(1),
  mergedId: z.string().min(1),
  fieldResolution: z.record(z.string(), z.enum(["surviving", "merged"])),
  reviewNotes: z.string().max(1000).optional(),
});

export type MergeParticipantsInput = z.infer<typeof mergeParticipantsSchema>;

export { BLACKLIST_TYPES };
