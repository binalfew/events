-- CreateTable
CREATE TABLE "SectionTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "definition" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SectionTemplate_tenantId_idx" ON "SectionTemplate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionTemplate_tenantId_name_key" ON "SectionTemplate"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "SectionTemplate" ADD CONSTRAINT "SectionTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
