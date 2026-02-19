import { z } from "zod/v4";

const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
const UPDATE_USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "LOCKED"] as const;

export const createUserSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  name: z.string().optional().default(""),
  status: z.enum(USER_STATUSES).optional().default("ACTIVE"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  name: z.string().optional().default(""),
  status: z.enum(UPDATE_USER_STATUSES).optional().default("ACTIVE"),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
