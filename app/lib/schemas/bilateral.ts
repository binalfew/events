import { z } from "zod/v4";

export const requestMeetingSchema = z.object({
  eventId: z.string().cuid(),
  requesterId: z.string().cuid(),
  requesteeId: z.string().cuid(),
  priority: z.coerce.number().int().min(0).max(10).default(0),
  duration: z.coerce.number().int().min(15).max(180).default(30),
  notes: z
    .string()
    .max(2000)
    .transform((v) => v || undefined)
    .pipe(z.string().optional()),
  preferredSlots: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().optional()),
});

export type RequestMeetingInput = z.infer<typeof requestMeetingSchema>;

export const confirmMeetingSchema = z.object({
  meetingId: z.string().cuid(),
  slotId: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().cuid().optional()),
  roomId: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().cuid().optional()),
  scheduledAt: z.string().min(1, "Scheduled time is required"),
});

export type ConfirmMeetingInput = z.infer<typeof confirmMeetingSchema>;

export const bilateralFiltersSchema = z.object({
  status: z.enum(["REQUESTED", "CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED"]).optional(),
  date: z.string().optional(),
  participantId: z.string().optional(),
});
