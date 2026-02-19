import { z } from "zod/v4";

export const createTemplateSchema = z.object({
  eventId: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().cuid().optional()),
  name: z.string().min(1, "Name is required").max(200),
  description: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(1000).optional()),
  layout: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().optional()),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const generateCertificateSchema = z.object({
  templateId: z.string().cuid(),
  participantId: z.string().cuid(),
});

export type GenerateCertificateInput = z.infer<typeof generateCertificateSchema>;

export const bulkGenerateSchema = z.object({
  templateId: z.string().cuid(),
  status: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().optional()),
  participantTypeId: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().cuid().optional()),
});

export type BulkGenerateInput = z.infer<typeof bulkGenerateSchema>;

export const certificateFiltersSchema = z.object({
  status: z.enum(["DRAFT", "GENERATED", "SENT", "DOWNLOADED", "REVOKED"]).optional(),
  templateId: z.string().optional(),
});
