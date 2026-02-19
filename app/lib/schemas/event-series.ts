import { z } from "zod/v4";

export const createSeriesSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(1000).optional()),
});

export type CreateSeriesInput = z.infer<typeof createSeriesSchema>;

export const addEditionSchema = z.object({
  seriesId: z.string().cuid(),
  eventId: z.string().cuid(),
  editionNumber: z.coerce.number().int().min(1),
  year: z.coerce.number().int().min(1900).max(2100),
  hostCountry: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(200).optional()),
  hostCity: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(200).optional()),
  notes: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(1000).optional()),
});

export type AddEditionInput = z.infer<typeof addEditionSchema>;
