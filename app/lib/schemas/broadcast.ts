import { z } from "zod/v4";

const MESSAGE_CHANNELS = ["EMAIL", "SMS", "PUSH", "IN_APP"] as const;
const PARTICIPANT_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "PRINTED",
] as const;

export const audienceFilterSchema = z.object({
  participantTypes: z.array(z.string()).optional(),
  statuses: z.array(z.enum(PARTICIPANT_STATUSES)).optional(),
  registeredAfter: z.coerce.date().optional(),
  registeredBefore: z.coerce.date().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export type AudienceFilter = z.infer<typeof audienceFilterSchema>;

export const createBroadcastSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  subject: z.string().max(200, "Subject must be at most 200 characters").optional(),
  body: z.string().min(1, "Body is required").max(50000, "Body must be at most 50,000 characters"),
  channel: z.enum(MESSAGE_CHANNELS),
  filters: audienceFilterSchema.optional(),
  templateId: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
  isEmergency: z.coerce.boolean().default(false),
  priority: z.coerce.number().int().min(1).max(10).default(5),
});

export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;
