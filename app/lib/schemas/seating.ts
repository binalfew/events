import { z } from "zod/v4";

export const createSeatingPlanSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Plan name is required").max(200),
  layoutType: z.enum(["table", "theater", "u-shape", "classroom"]),
  totalSeats: z.coerce.number().int().min(1, "Must have at least 1 seat"),
});

export type CreateSeatingPlanInput = z.infer<typeof createSeatingPlanSchema>;

export const assignSeatSchema = z.object({
  seatingPlanId: z.string().cuid(),
  participantId: z.string().cuid(),
  seatLabel: z.string().min(1, "Seat label is required").max(50),
  tableNumber: z.coerce.number().int().optional(),
  priority: z.enum([
    "HEAD_OF_STATE",
    "MINISTER",
    "AMBASSADOR",
    "SENIOR_OFFICIAL",
    "DELEGATE",
    "OBSERVER",
    "MEDIA",
  ]),
});

export type AssignSeatInput = z.infer<typeof assignSeatSchema>;

export const addConflictSchema = z.object({
  eventId: z.string().cuid(),
  participantAId: z.string().cuid(),
  participantBId: z.string().cuid(),
  conflictType: z.string().min(1, "Conflict type is required").max(100),
  description: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(500).optional()),
  seatingPlanId: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().cuid().optional()),
});

export type AddConflictInput = z.infer<typeof addConflictSchema>;

export const seatingFiltersSchema = z.object({
  planId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type SeatingFilters = z.infer<typeof seatingFiltersSchema>;
