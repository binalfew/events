import { z } from "zod/v4";

export const registerStaffSchema = z.object({
  eventId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.enum([
    "COORDINATOR",
    "USHER",
    "SECURITY",
    "PROTOCOL",
    "TECHNICAL",
    "MEDICAL",
    "TRANSPORT",
    "CATERING",
  ]),
  zone: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(200).optional()),
  phone: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(50).optional()),
});

export type RegisterStaffInput = z.infer<typeof registerStaffSchema>;

export const createShiftSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Shift name is required").max(200),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  zone: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(200).optional()),
  requiredRole: z
    .string()
    .transform((v) => v || undefined)
    .pipe(
      z
        .enum([
          "COORDINATOR",
          "USHER",
          "SECURITY",
          "PROTOCOL",
          "TECHNICAL",
          "MEDICAL",
          "TRANSPORT",
          "CATERING",
        ])
        .optional(),
    ),
  capacity: z.coerce.number().int().min(1),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;

export const staffFiltersSchema = z.object({
  role: z
    .enum([
      "COORDINATOR",
      "USHER",
      "SECURITY",
      "PROTOCOL",
      "TECHNICAL",
      "MEDICAL",
      "TRANSPORT",
      "CATERING",
    ])
    .optional(),
  activeOnly: z.string().optional(),
});
