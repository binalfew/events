-- AlterTable: add branding columns (nullable)
ALTER TABLE "Tenant" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "primaryColor" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "secondaryColor" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "accentColor" TEXT;

-- AlterTable: add slug as nullable first
ALTER TABLE "Tenant" ADD COLUMN "slug" TEXT;

-- Backfill existing rows with a slug derived from name
UPDATE "Tenant" SET "slug" = LOWER(REGEXP_REPLACE(REPLACE("name", ' ', '-'), '[^a-z0-9-]', '', 'g')) WHERE "slug" IS NULL;

-- Make slug NOT NULL and UNIQUE
ALTER TABLE "Tenant" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
