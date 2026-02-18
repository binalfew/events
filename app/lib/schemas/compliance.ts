import { z } from "zod/v4";

export const createDocumentRequirementSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(200),
  description: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(1000).optional()),
  documentType: z.string().min(1, "Document type is required").max(100),
  isRequired: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  participantTypes: z
    .string()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    )
    .pipe(z.array(z.string())),
  validityDays: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.coerce.number().int().min(1).optional()),
});

export type CreateDocumentRequirementInput = z.infer<typeof createDocumentRequirementSchema>;

export const submitDocumentSchema = z.object({
  requirementId: z.string().cuid(),
  participantId: z.string().cuid(),
  documentNumber: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(100).optional()),
  expiresAt: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().optional()),
  notes: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(1000).optional()),
});

export type SubmitDocumentInput = z.infer<typeof submitDocumentSchema>;

export const verifyDocumentSchema = z.object({
  status: z.enum(["VALID", "EXPIRED"]),
  notes: z
    .string()
    .transform((v) => v || undefined)
    .pipe(z.string().max(1000).optional()),
});

export type VerifyDocumentInput = z.infer<typeof verifyDocumentSchema>;

export const createRetentionPolicySchema = z.object({
  entityType: z.string().min(1, "Entity type is required").max(100),
  retentionDays: z.coerce.number().int().min(1, "Retention days must be at least 1"),
  action: z.enum(["RETAIN", "ANONYMIZE", "DELETE"]),
});

export type CreateRetentionPolicyInput = z.infer<typeof createRetentionPolicySchema>;

export const complianceFiltersSchema = z.object({
  status: z.enum(["VALID", "EXPIRING_SOON", "EXPIRED", "NOT_PROVIDED"]).optional(),
  requirementId: z.string().optional(),
});
