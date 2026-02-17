import { z } from "zod/v4";

const MESSAGE_CHANNELS = ["EMAIL", "SMS", "PUSH", "IN_APP"] as const;

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  subject: z.string().max(200, "Subject must be at most 200 characters").optional(),
  body: z.string().min(1, "Body is required").max(10000, "Body must be at most 10,000 characters"),
  channel: z.enum(MESSAGE_CHANNELS),
  variables: z.array(z.string().min(1)).default([]),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = createTemplateSchema.partial();

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export { MESSAGE_CHANNELS };
