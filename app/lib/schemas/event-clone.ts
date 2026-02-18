import { z } from "zod/v4";

// ─── Clone Options ──────────────────────────────────────

export const cloneElementsSchema = z.object({
  workflows: z.boolean().default(false),
  forms: z.boolean().default(false),
  participantTypes: z.boolean().default(false),
  fieldDefinitions: z.boolean().default(false),
  delegations: z.boolean().default(false),
  checkpoints: z.boolean().default(false),
});

export const cloneOptionsSchema = z.object({
  sourceEventId: z.string().min(1, "Source event ID is required"),
  targetEventName: z.string().min(1, "Target event name is required").max(200),
  targetStartDate: z.string().min(1, "Start date is required"),
  targetEndDate: z.string().min(1, "End date is required"),
  elements: cloneElementsSchema,
  seriesId: z.string().optional(),
  editionNumber: z.coerce.number().int().positive().optional(),
});

export type CloneOptions = z.infer<typeof cloneOptionsSchema>;
export type CloneElements = z.infer<typeof cloneElementsSchema>;

// ─── Series CRUD ────────────────────────────────────────

export const createSeriesSchema = z.object({
  name: z.string().min(1, "Series name is required").max(200),
  description: z.string().max(500).optional(),
});

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>;

export const updateSeriesSchema = createSeriesSchema.partial();

export type UpdateSeriesInput = z.infer<typeof updateSeriesSchema>;

// ─── Edition CRUD ───────────────────────────────────────

export const addEditionSchema = z.object({
  seriesId: z.string().min(1, "Series ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  editionNumber: z.coerce.number().int().positive("Edition number must be positive"),
  year: z.coerce.number().int().min(1900).max(2100),
  hostCountry: z.string().max(100).optional(),
  hostCity: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type AddEditionInput = z.infer<typeof addEditionSchema>;

export const updateEditionSchema = addEditionSchema
  .omit({ seriesId: true, eventId: true })
  .partial();

export type UpdateEditionInput = z.infer<typeof updateEditionSchema>;
