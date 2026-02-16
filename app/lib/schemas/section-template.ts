import { z } from "zod/v4";

const sectionFieldPlacementSchema = z.object({
  id: z.string().min(1),
  fieldDefinitionId: z.string().min(1),
  colSpan: z.number().int().min(1).max(12).optional(),
  order: z.number().int().min(0),
});

const sectionDefinitionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  collapsible: z.boolean(),
  defaultCollapsed: z.boolean().optional(),
  fields: z.array(sectionFieldPlacementSchema),
});

export const createSectionTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  definition: sectionDefinitionSchema,
});

export const updateSectionTemplateSchema = createSectionTemplateSchema.partial();

export type CreateSectionTemplateInput = z.infer<typeof createSectionTemplateSchema>;
export type UpdateSectionTemplateInput = z.infer<typeof updateSectionTemplateSchema>;
