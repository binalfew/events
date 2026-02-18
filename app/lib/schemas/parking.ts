import { z } from "zod/v4";

export const createParkingZoneSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Zone name is required").max(200),
  code: z.string().min(1, "Zone code is required").max(20),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  color: z.string().max(20).optional(),
});

export type CreateParkingZoneInput = z.infer<typeof createParkingZoneSchema>;

export const issuePermitSchema = z.object({
  eventId: z.string().cuid(),
  zoneId: z.string().cuid(),
  participantId: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().cuid().optional()),
  vehiclePlate: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(20).optional()),
  validFrom: z.string().min(1, "Valid from date is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
});

export type IssuePermitInput = z.infer<typeof issuePermitSchema>;

export const parkingFiltersSchema = z.object({
  zoneId: z.string().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "REVOKED", "SUSPENDED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ParkingFilters = z.infer<typeof parkingFiltersSchema>;
