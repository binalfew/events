import { z } from "zod/v4";

const EVENT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "CANCELED",
  "COMPLETED",
  "POSTPONED",
  "RESCHEDULED",
] as const;

export const createEventSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200, "Name must be at most 200 characters"),
    description: z
      .string()
      .max(2000, "Description must be at most 2000 characters")
      .optional()
      .default(""),
    status: z.enum(EVENT_STATUSES).optional().default("DRAFT"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200, "Name must be at most 200 characters"),
    description: z
      .string()
      .max(2000, "Description must be at most 2000 characters")
      .optional()
      .default(""),
    status: z.enum(EVENT_STATUSES),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
