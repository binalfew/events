-- RenameTable: CustomFieldDef → FieldDefinition
ALTER TABLE "CustomFieldDef" RENAME TO "FieldDefinition";

-- RenameColumn: Event.customData → Event.extras
ALTER TABLE "Event" RENAME COLUMN "customData" TO "extras";

-- RenameColumn: Participant.customData → Participant.extras
ALTER TABLE "Participant" RENAME COLUMN "customData" TO "extras";

-- Rename indexes to match new table name
ALTER INDEX "CustomFieldDef_pkey" RENAME TO "FieldDefinition_pkey";
ALTER INDEX "CustomFieldDef_tenantId_eventId_idx" RENAME TO "FieldDefinition_tenantId_eventId_idx";
ALTER INDEX "CustomFieldDef_eventId_participantTypeId_sortOrder_idx" RENAME TO "FieldDefinition_eventId_participantTypeId_sortOrder_idx";
ALTER INDEX "CustomFieldDef_tenantId_eventId_participantTypeId_entityTyp_key" RENAME TO "FieldDefinition_tenantId_eventId_participantTypeId_entityTy_key";

-- Rename FK constraints to match new table name
ALTER TABLE "FieldDefinition" RENAME CONSTRAINT "CustomFieldDef_tenantId_fkey" TO "FieldDefinition_tenantId_fkey";
ALTER TABLE "FieldDefinition" RENAME CONSTRAINT "CustomFieldDef_eventId_fkey" TO "FieldDefinition_eventId_fkey";
ALTER TABLE "FieldDefinition" RENAME CONSTRAINT "CustomFieldDef_participantTypeId_fkey" TO "FieldDefinition_participantTypeId_fkey";
