import { z } from "zod/v4";
import { FORM_TEMPLATE_LIMITS } from "~/config/form-templates";

// ─── Visibility Condition Schemas ────────────────────────

const conditionOperatorSchema = z.enum([
  "eq",
  "neq",
  "empty",
  "notEmpty",
  "gt",
  "lt",
  "gte",
  "lte",
  "contains",
  "in",
  "notIn",
]);

const simpleConditionSchema = z.object({
  type: z.literal("simple"),
  field: z.string().min(1),
  operator: conditionOperatorSchema,
  value: z.unknown(),
});

type VisibilityConditionInput =
  | { type: "simple"; field: string; operator: string; value: unknown }
  | { type: "compound"; operator: "and" | "or"; conditions: VisibilityConditionInput[] };

const visibilityConditionSchema: z.ZodType<VisibilityConditionInput> = z.union([
  simpleConditionSchema,
  z.object({
    type: z.literal("compound"),
    operator: z.enum(["and", "or"]),
    conditions: z.lazy(() => z.array(visibilityConditionSchema)),
  }),
]);

// ─── Form Definition Schema ─────────────────────────────

const formFieldPlacementSchema = z.object({
  id: z.string().min(1),
  fieldDefinitionId: z.string().min(1),
  colSpan: z.number().int().min(1).max(12).optional(),
  rowSpan: z.number().int().min(1).optional(),
  order: z.number().int().min(0),
  visibleIf: visibilityConditionSchema.optional(),
});

const formSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  collapsible: z.boolean(),
  defaultCollapsed: z.boolean().optional(),
  order: z.number().int().min(0),
  visibleIf: visibilityConditionSchema.optional(),
  fields: z.array(formFieldPlacementSchema),
});

const formPageSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0),
  visibleIf: visibilityConditionSchema.optional(),
  sections: z.array(formSectionSchema),
});

const formSettingsSchema = z.object({
  displayMode: z.enum(["wizard", "single-page", "accordion"]),
  showProgressBar: z.boolean(),
  submitButtonText: z.string().min(1),
  successMessage: z.string().optional(),
  redirectUrl: z.string().url().optional(),
  enableAnalytics: z.boolean().optional(),
  enablePrefill: z.boolean().optional(),
  abTestVariant: z.string().optional(),
});

export const formDefinitionSchema = z.object({
  settings: formSettingsSchema.optional(),
  pages: z.array(formPageSchema),
});

// ─── CRUD Schemas ────────────────────────────────────────

export const createFormTemplateSchema = z.object({
  eventId: z.string().cuid(),
  participantTypeId: z.string().cuid().optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(
      FORM_TEMPLATE_LIMITS.maxNameLength,
      `Name must be at most ${FORM_TEMPLATE_LIMITS.maxNameLength} characters`,
    ),
  description: z
    .string()
    .max(
      FORM_TEMPLATE_LIMITS.maxDescriptionLength,
      `Description must be at most ${FORM_TEMPLATE_LIMITS.maxDescriptionLength} characters`,
    )
    .optional(),
  definition: formDefinitionSchema.optional(),
});

export const updateFormTemplateSchema = createFormTemplateSchema.omit({ eventId: true }).partial();

export const cloneFormTemplateSchema = z.object({
  newName: z
    .string()
    .min(1, "Name is required")
    .max(
      FORM_TEMPLATE_LIMITS.maxNameLength,
      `Name must be at most ${FORM_TEMPLATE_LIMITS.maxNameLength} characters`,
    ),
});

export type CreateFormTemplateInput = z.infer<typeof createFormTemplateSchema>;
export type UpdateFormTemplateInput = z.infer<typeof updateFormTemplateSchema>;
export type CloneFormTemplateInput = z.infer<typeof cloneFormTemplateSchema>;
