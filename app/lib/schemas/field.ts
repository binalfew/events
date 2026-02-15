import { z } from "zod/v4";
import { FIELD_LIMITS } from "~/config/fields";

const FIELD_DATA_TYPES = [
  "TEXT",
  "LONG_TEXT",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "ENUM",
  "MULTI_ENUM",
  "EMAIL",
  "URL",
  "PHONE",
  "FILE",
  "IMAGE",
  "REFERENCE",
  "FORMULA",
  "JSON",
] as const;

const ENTITY_TYPES = ["Participant", "Event"] as const;

export const fieldNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(FIELD_LIMITS.maxNameLength, `Name must be at most ${FIELD_LIMITS.maxNameLength} characters`)
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Name must start with a lowercase letter and contain only lowercase letters, digits, and underscores",
  );

export const createFieldSchema = z.object({
  eventId: z.string().cuid(),
  participantTypeId: z.string().cuid().optional(),
  entityType: z.enum(ENTITY_TYPES).default("Participant"),
  name: fieldNameSchema,
  label: z
    .string()
    .min(1, "Label is required")
    .max(
      FIELD_LIMITS.maxLabelLength,
      `Label must be at most ${FIELD_LIMITS.maxLabelLength} characters`,
    ),
  description: z
    .string()
    .max(
      FIELD_LIMITS.maxDescriptionLength,
      `Description must be at most ${FIELD_LIMITS.maxDescriptionLength} characters`,
    )
    .optional(),
  dataType: z.enum(FIELD_DATA_TYPES),
  isRequired: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isSearchable: z.boolean().default(false),
  isFilterable: z.boolean().default(false),
  defaultValue: z.string().optional(),
  config: z.record(z.string(), z.unknown()).default({}),
  validation: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const updateFieldSchema = createFieldSchema.omit({ eventId: true }).partial();

export const reorderFieldsSchema = z.object({
  fieldIds: z.array(z.string().cuid()).min(1, "At least one field ID is required"),
});

export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
export type ReorderFieldsInput = z.infer<typeof reorderFieldsSchema>;
