-- AlterTable
ALTER TABLE "FieldDefinition" ALTER COLUMN "eventId" DROP NOT NULL;

-- CreateIndex (partial unique for global fields where eventId IS NULL)
CREATE UNIQUE INDEX "FieldDefinition_tenantId_entityType_name_global_key"
  ON "FieldDefinition" ("tenantId", "entityType", "name")
  WHERE "eventId" IS NULL;
