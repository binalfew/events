import { z } from "zod/v4";

export const addToWaitlistSchema = z.object({
  eventId: z.string().cuid(),
  participantId: z.string().cuid(),
  participantType: z.string().min(1, "Participant type is required").max(100),
  priority: z.enum(["STANDARD", "HIGH", "VIP"]).default("STANDARD"),
  registrationData: z.record(z.string(), z.unknown()).default({}),
});

export type AddToWaitlistInput = z.infer<typeof addToWaitlistSchema>;

export const updatePrioritySchema = z.object({
  priority: z.enum(["STANDARD", "HIGH", "VIP"]),
});

export type UpdatePriorityInput = z.infer<typeof updatePrioritySchema>;

export const waitlistFiltersSchema = z.object({
  status: z.enum(["ACTIVE", "PROMOTED", "EXPIRED", "WITHDRAWN", "CANCELLED"]).optional(),
  participantType: z.string().optional(),
  priority: z.enum(["STANDARD", "HIGH", "VIP"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type WaitlistFilters = z.infer<typeof waitlistFiltersSchema>;
