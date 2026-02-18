import { z } from "zod/v4";

export const createGiftItemSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(200),
  description: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(2000).optional()),
  category: z.string().min(1, "Category is required").max(100),
  value: z.coerce.number().min(0).optional(),
  currency: z.string().max(10).default("USD"),
  quantity: z.coerce.number().int().min(0),
  imageUrl: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().url().optional()),
});

export type CreateGiftItemInput = z.infer<typeof createGiftItemSchema>;

export const createWelcomePackageSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Package name is required").max(200),
  forParticipantType: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().optional()),
  contents: z
    .string()
    .transform((v) => v || "[]")
    .pipe(z.string()),
});

export type CreateWelcomePackageInput = z.infer<typeof createWelcomePackageSchema>;

export const assignPackageSchema = z.object({
  participantId: z.string().cuid(),
  welcomePackageId: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().cuid().optional()),
  giftItemId: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().cuid().optional()),
  recipientName: z.string().min(1, "Recipient name is required").max(200),
  notes: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(1000).optional()),
});

export type AssignPackageInput = z.infer<typeof assignPackageSchema>;
