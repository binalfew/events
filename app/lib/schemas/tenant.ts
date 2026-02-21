import { z } from "zod/v4";

const SUBSCRIPTION_PLANS = ["free", "starter", "professional", "enterprise"] as const;

const RESERVED_SLUGS = ["auth", "api", "kiosk", "delegation", "resources", "up"];

const slugField = z
  .string()
  .min(1, "Slug is required")
  .max(50, "Slug must be at most 50 characters")
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
    "Slug must be lowercase alphanumeric with hyphens only, cannot start or end with a hyphen",
  )
  .refine((val) => !RESERVED_SLUGS.includes(val), "This slug is reserved and cannot be used");

const hexColorField = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g. #1e40af)")
  .optional()
  .or(z.literal(""));

export const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be at most 200 characters"),
  slug: slugField,
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  country: z.string().optional().default(""),
  subscriptionPlan: z.enum(SUBSCRIPTION_PLANS).optional().default("free"),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  primaryColor: hexColorField,
  secondaryColor: hexColorField,
  accentColor: hexColorField,
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be at most 200 characters"),
  slug: slugField,
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  country: z.string().optional().default(""),
  subscriptionPlan: z.enum(SUBSCRIPTION_PLANS),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  primaryColor: hexColorField,
  secondaryColor: hexColorField,
  accentColor: hexColorField,
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
