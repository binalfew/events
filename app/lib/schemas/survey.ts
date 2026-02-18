import { z } from "zod/v4";

export const createSurveySchema = z.object({
  eventId: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(2000).optional()),
  formTemplateId: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().cuid().optional()),
  opensAt: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().optional()),
  closesAt: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().optional()),
  isAnonymous: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export type CreateSurveyInput = z.infer<typeof createSurveySchema>;

export const submitResponseSchema = z.object({
  surveyId: z.string().cuid(),
  participantId: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().cuid().optional()),
  answers: z.string().min(1, "Answers are required"),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

export const surveyFiltersSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
});
