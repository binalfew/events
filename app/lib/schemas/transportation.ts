import { z } from "zod/v4";

export const createRouteSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Route name is required").max(200),
  stops: z.array(z.object({ name: z.string().min(1), order: z.number().int().min(0) })).default([]),
  frequency: z.coerce.number().int().min(1).optional(),
  startTime: z.string().max(10).optional(),
  endTime: z.string().max(10).optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;

export const registerVehicleSchema = z.object({
  eventId: z.string().cuid(),
  plateNumber: z.string().min(1, "Plate number is required").max(20),
  type: z.enum(["SEDAN", "SUV", "VAN", "BUS", "MINIBUS"]),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
  driverName: z.string().max(200).optional(),
  driverPhone: z.string().max(50).optional(),
  gpsTrackingId: z.string().max(100).optional(),
});

export type RegisterVehicleInput = z.infer<typeof registerVehicleSchema>;

export const scheduleTransferSchema = z.object({
  eventId: z.string().cuid(),
  routeId: z.string().cuid().optional(),
  type: z.enum(["AIRPORT_ARRIVAL", "AIRPORT_DEPARTURE", "INTER_VENUE", "CUSTOM"]),
  origin: z.string().min(1, "Origin is required").max(300),
  destination: z.string().min(1, "Destination is required").max(300),
  scheduledAt: z.string().min(1, "Scheduled time is required"),
  participantIds: z.array(z.string().cuid()).min(1, "At least one participant required"),
  notes: z.string().max(1000).optional(),
});

export type ScheduleTransferInput = z.infer<typeof scheduleTransferSchema>;

export const transportFiltersSchema = z.object({
  status: z.enum(["SCHEDULED", "EN_ROUTE", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  type: z.enum(["AIRPORT_ARRIVAL", "AIRPORT_DEPARTURE", "INTER_VENUE", "CUSTOM"]).optional(),
  date: z.string().optional(),
  routeId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type TransportFilters = z.infer<typeof transportFiltersSchema>;
