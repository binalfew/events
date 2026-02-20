-- DropIndex
DROP INDEX "FieldDefinition_tenantId_entityType_name_global_key";

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "extras" JSONB NOT NULL DEFAULT '{}';
