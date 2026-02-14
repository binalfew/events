-- DropIndex
DROP INDEX "Session_userId_idx";

-- CreateIndex
CREATE INDEX "Session_userId_expirationDate_idx" ON "Session"("userId", "expirationDate");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
