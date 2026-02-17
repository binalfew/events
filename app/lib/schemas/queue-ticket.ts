import { z } from "zod/v4";

export const joinQueueSchema = z.object({
  eventId: z.string().cuid(),
  participantId: z.string().cuid(),
  serviceType: z.string().min(1, "Service type is required").max(100),
  priority: z.coerce.number().int().min(0).default(0),
});

export type JoinQueueInput = z.infer<typeof joinQueueSchema>;
