import { z } from "zod/v4";

export const reportIncidentSchema = z.object({
  eventId: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  category: z.string().min(1, "Category is required").max(100),
  location: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(500).optional()),
});

export type ReportIncidentInput = z.infer<typeof reportIncidentSchema>;

export const addUpdateSchema = z.object({
  incidentId: z.string().cuid(),
  message: z.string().min(1, "Update message is required").max(5000),
});

export type AddUpdateInput = z.infer<typeof addUpdateSchema>;

export const escalateSchema = z.object({
  incidentId: z.string().cuid(),
  escalatedTo: z.string().cuid(),
  reason: z.string().min(1, "Escalation reason is required").max(2000),
});

export type EscalateInput = z.infer<typeof escalateSchema>;

export const incidentFiltersSchema = z.object({
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["REPORTED", "INVESTIGATING", "ESCALATED", "RESOLVED", "CLOSED"]).optional(),
  category: z.string().optional(),
});
