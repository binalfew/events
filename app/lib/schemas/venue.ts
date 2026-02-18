import { z } from "zod/v4";

export const createVenueMapSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Venue name is required").max(200),
  description: z.string().max(1000).optional(),
  floorPlanUrl: z.string().url().optional(),
});

export type CreateVenueMapInput = z.infer<typeof createVenueMapSchema>;

export const createRoomSchema = z.object({
  venueMapId: z.string().cuid(),
  name: z.string().min(1, "Room name is required").max(200),
  floor: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(50).optional()),
  capacity: z.coerce.number().int().min(1).optional(),
  roomType: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(100).optional()),
  equipment: z.string().optional(), // comma-separated list, parsed to JSON array
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const bookRoomSchema = z.object({
  eventId: z.string().cuid(),
  roomId: z.string().cuid(),
  title: z.string().min(1, "Booking title is required").max(200),
  description: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(1000).optional()),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

export type BookRoomInput = z.infer<typeof bookRoomSchema>;

export const venueFiltersSchema = z.object({
  venueMapId: z.string().optional(),
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type VenueFilters = z.infer<typeof venueFiltersSchema>;
