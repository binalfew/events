import { z } from "zod/v4";

const BULK_OPERATION_TYPES = [
  "IMPORT_PARTICIPANTS",
  "EXPORT_PARTICIPANTS",
  "STATUS_CHANGE",
  "BULK_APPROVE",
  "BULK_REJECT",
  "BULK_BYPASS",
  "FIELD_UPDATE",
  "DELETE",
] as const;

export const createBulkOperationSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  type: z.enum(BULK_OPERATION_TYPES),
  description: z.string().min(1, "Description is required").max(500),
});

export type CreateBulkOperationInput = z.infer<typeof createBulkOperationSchema>;

export const columnMappingSchema = z.object({
  sourceColumn: z.string(),
  targetField: z.string(),
  transform: z.enum(["uppercase", "lowercase", "trim", "date-parse"]).optional(),
});

export type ColumnMapping = z.infer<typeof columnMappingSchema>;

export const confirmOperationSchema = z.object({
  operationId: z.string().min(1, "Operation ID is required"),
  skipErrors: z.coerce.boolean().default(false),
});

export type ConfirmOperationInput = z.infer<typeof confirmOperationSchema>;
