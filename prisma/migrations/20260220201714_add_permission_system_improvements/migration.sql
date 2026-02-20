-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('GLOBAL', 'TENANT', 'EVENT');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "scope" "RoleScope" NOT NULL DEFAULT 'EVENT';

-- AlterTable
ALTER TABLE "RolePermission" ADD COLUMN     "access" TEXT NOT NULL DEFAULT 'any';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "fingerprint" TEXT;

-- AlterTable
ALTER TABLE "UserRole" ADD COLUMN     "stepId" TEXT;

-- CreateIndex
CREATE INDEX "Session_userId_fingerprint_idx" ON "Session"("userId", "fingerprint");

-- CreateIndex
CREATE INDEX "UserRole_stepId_idx" ON "UserRole"("stepId");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE SET NULL ON UPDATE CASCADE;
