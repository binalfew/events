import { z } from "zod/v4";

const KIOSK_MODES = ["self-service", "check-in", "queue-display", "info"] as const;
const KIOSK_LANGUAGES = ["en", "fr", "am", "ar"] as const;

export const registerDeviceSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  location: z
    .string()
    .min(1, "Location is required")
    .max(200, "Location must be at most 200 characters"),
  mode: z.enum(KIOSK_MODES),
  language: z.enum(KIOSK_LANGUAGES).default("en"),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

export const updateDeviceSchema = registerDeviceSchema.omit({ eventId: true }).partial();

export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;

export { KIOSK_MODES, KIOSK_LANGUAGES };
