import { z } from "zod/v4";

const BATCH_ACTIONS = ["APPROVE", "REJECT", "BYPASS"] as const;
const PARTICIPANT_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "PRINTED",
] as const;

export const batchActionSchema = z.object({
  eventId: z.string().min(1),
  action: z.enum(BATCH_ACTIONS),
  participantIds: z.array(z.string().min(1)).min(1),
  remarks: z.string().max(500).optional(),
  dryRun: z.coerce.boolean().default(false),
});

export type BatchActionInput = z.infer<typeof batchActionSchema>;

export const participantListFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(PARTICIPANT_STATUSES).optional(),
  participantTypeId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
});

export type ParticipantListFilter = z.infer<typeof participantListFilterSchema>;
