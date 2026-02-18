import { z } from "zod/v4";

export const createHotelSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Hotel name is required").max(200),
  address: z.string().min(1, "Address is required").max(500),
  starRating: z.coerce.number().int().min(1).max(5).optional(),
  totalRooms: z.coerce.number().int().min(1, "Must have at least 1 room"),
  contactName: z.string().max(200).optional(),
  contactPhone: z.string().max(50).optional(),
  distanceToVenue: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateHotelInput = z.infer<typeof createHotelSchema>;

export const createRoomBlockSchema = z.object({
  hotelId: z.string().cuid(),
  roomType: z.string().min(1, "Room type is required").max(100),
  quantity: z.coerce.number().int().min(1, "Must have at least 1 room"),
  pricePerNight: z.coerce.number().min(0).optional(),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  contactEmail: z.string().email().optional(),
  participantTypeId: z.string().cuid().optional(),
});

export type CreateRoomBlockInput = z.infer<typeof createRoomBlockSchema>;

export const assignRoomSchema = z.object({
  roomBlockId: z.string().cuid(),
  participantId: z.string().cuid(),
  roomNumber: z.string().max(50).optional(),
  specialRequests: z.string().max(1000).optional(),
});

export type AssignRoomInput = z.infer<typeof assignRoomSchema>;

export const accommodationFiltersSchema = z.object({
  hotelId: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type AccommodationFilters = z.infer<typeof accommodationFiltersSchema>;
