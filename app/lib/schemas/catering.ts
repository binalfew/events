import { z } from "zod/v4";

export const createMealPlanSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Meal plan name is required").max(200),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(1000).optional(),
});

export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>;

export const createMealSessionSchema = z.object({
  mealPlanId: z.string().cuid(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "RECEPTION", "COFFEE_BREAK", "SNACK"]),
  venue: z.string().min(1, "Venue is required").max(300),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  capacity: z.coerce.number().int().min(1).optional(),
  menuNotes: z.string().max(2000).optional(),
});

export type CreateMealSessionInput = z.infer<typeof createMealSessionSchema>;

export const issueMealVoucherSchema = z.object({
  mealSessionId: z.string().cuid(),
  participantId: z.string().cuid(),
  dietaryCategory: z
    .enum(["REGULAR", "VEGETARIAN", "VEGAN", "HALAL", "KOSHER", "GLUTEN_FREE", "CUSTOM"])
    .default("REGULAR"),
});

export type IssueMealVoucherInput = z.infer<typeof issueMealVoucherSchema>;

export const cateringFiltersSchema = z.object({
  mealPlanId: z.string().optional(),
  mealType: z
    .enum(["BREAKFAST", "LUNCH", "DINNER", "RECEPTION", "COFFEE_BREAK", "SNACK"])
    .optional(),
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CateringFilters = z.infer<typeof cateringFiltersSchema>;
