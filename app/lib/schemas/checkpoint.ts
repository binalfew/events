import { z } from "zod/v4";

const CHECKPOINT_TYPES = ["gate", "meeting-room", "vip-area", "registration-desk"] as const;
const CHECKPOINT_DIRECTIONS = ["entry", "exit", "bidirectional"] as const;

export const createCheckpointSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  location: z.string().max(200, "Location must be at most 200 characters").optional(),
  type: z.enum(CHECKPOINT_TYPES),
  direction: z.enum(CHECKPOINT_DIRECTIONS),
  capacity: z.coerce.number().int().positive("Capacity must be positive").optional(),
});

export type CreateCheckpointInput = z.infer<typeof createCheckpointSchema>;

export const updateCheckpointSchema = createCheckpointSchema.omit({ eventId: true }).partial();

export type UpdateCheckpointInput = z.infer<typeof updateCheckpointSchema>;

export { CHECKPOINT_TYPES, CHECKPOINT_DIRECTIONS };
