import { z } from "zod/v4";

const FIELD_QUERY_OPERATORS = [
  "eq",
  "neq",
  "contains",
  "startsWith",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "notIn",
  "isNull",
  "isNotNull",
] as const;

const fieldNameRegex = /^[a-z][a-z0-9_]*$/;

const STANDARD_ORDER_COLUMNS = [
  "createdAt",
  "updatedAt",
  "firstName",
  "lastName",
  "email",
  "organization",
  "status",
  "registrationCode",
] as const;

export const customFieldConditionSchema = z.object({
  field: z
    .string()
    .min(1)
    .max(64)
    .regex(fieldNameRegex, "Field name must be lowercase alphanumeric with underscores"),
  operator: z.enum(FIELD_QUERY_OPERATORS),
  value: z.unknown().optional(),
});

export const participantSearchSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  conditions: z
    .array(customFieldConditionSchema)
    .max(20, "Maximum 20 conditions allowed")
    .default([]),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
  orderBy: z
    .string()
    .refine(
      (val) =>
        STANDARD_ORDER_COLUMNS.includes(val as (typeof STANDARD_ORDER_COLUMNS)[number]) ||
        fieldNameRegex.test(val),
      "orderBy must be a standard column or valid field name",
    )
    .default("createdAt"),
  orderDir: z.enum(["asc", "desc"]).default("desc"),
});

export type CustomFieldCondition = z.infer<typeof customFieldConditionSchema>;
export type ParticipantSearchInput = z.infer<typeof participantSearchSchema>;
export { STANDARD_ORDER_COLUMNS, FIELD_QUERY_OPERATORS };
