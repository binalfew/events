-- DropForeignKey
ALTER TABLE "FieldDefinition" DROP CONSTRAINT "FieldDefinition_participantTypeId_fkey";

-- DropIndex
DROP INDEX "FieldDefinition_eventId_participantTypeId_sortOrder_idx";

-- DropIndex
DROP INDEX "FieldDefinition_tenantId_eventId_participantTypeId_entityTy_key";

-- AlterTable
ALTER TABLE "FieldDefinition" DROP COLUMN "participantTypeId";

-- CreateIndex
CREATE INDEX "FieldDefinition_eventId_entityType_sortOrder_idx" ON "FieldDefinition"("eventId", "entityType", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FieldDefinition_tenantId_eventId_entityType_name_key" ON "FieldDefinition"("tenantId", "eventId", "entityType", "name");
