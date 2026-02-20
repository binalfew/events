import { z } from "zod/v4";

const SUBSCRIPTION_PLANS = ["free", "starter", "professional", "enterprise"] as const;

export const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be at most 200 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  country: z.string().optional().default(""),
  subscriptionPlan: z.enum(SUBSCRIPTION_PLANS).optional().default("free"),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be at most 200 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  country: z.string().optional().default(""),
  subscriptionPlan: z.enum(SUBSCRIPTION_PLANS),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
