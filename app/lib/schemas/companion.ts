import { z } from "zod/v4";

export const registerCompanionSchema = z.object({
  eventId: z.string().cuid(),
  primaryParticipantId: z.string().cuid(),
  firstName: z.string().min(1, "First name is required").max(200),
  lastName: z.string().min(1, "Last name is required").max(200),
  type: z.enum(["SPOUSE", "FAMILY", "AIDE", "SECURITY", "INTERPRETER"]),
  email: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().email().optional()),
  phone: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(50).optional()),
  passportNumber: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(50).optional()),
  nationality: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(100).optional()),
});

export type RegisterCompanionInput = z.infer<typeof registerCompanionSchema>;

export const createActivitySchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Activity name is required").max(200),
  description: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(2000).optional()),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required").max(500),
  capacity: z.coerce.number().int().min(1),
  transportIncluded: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  cost: z.coerce.number().min(0).optional().default(0),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const companionFiltersSchema = z.object({
  type: z.enum(["SPOUSE", "FAMILY", "AIDE", "SECURITY", "INTERPRETER"]).optional(),
  participantId: z.string().optional(),
});
