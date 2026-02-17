-- CreateEnum
CREATE TYPE "AssignmentStrategy" AS ENUM ('MANUAL', 'ROUND_ROBIN', 'LEAST_LOADED');

-- CreateEnum
CREATE TYPE "AutoActionType" AS ENUM ('AUTO_APPROVE', 'AUTO_REJECT', 'AUTO_BYPASS', 'AUTO_ESCALATE');

-- CreateEnum
CREATE TYPE "DelegationInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('TABLE', 'KANBAN', 'CALENDAR', 'GALLERY');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepAssignment" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategy" "AssignmentStrategy" NOT NULL DEFAULT 'MANUAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoActionRule" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "conditionExpression" JSONB NOT NULL,
    "actionType" "AutoActionType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoActionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelegationQuota" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelegationQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelegationInvite" (
    "id" TEXT NOT NULL,
    "quotaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "DelegationInviteStatus" NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelegationInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "viewType" "ViewType" NOT NULL DEFAULT 'TABLE',
    "filters" JSONB NOT NULL DEFAULT '[]',
    "sorts" JSONB NOT NULL DEFAULT '[]',
    "columns" JSONB NOT NULL DEFAULT '[]',
    "config" JSONB NOT NULL DEFAULT '{}',
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomObjectDefinition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomObjectDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomObjectRecord" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomObjectRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dimensions" JSONB NOT NULL DEFAULT '{}',
    "period" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE INDEX "StepAssignment_stepId_isActive_idx" ON "StepAssignment"("stepId", "isActive");

-- CreateIndex
CREATE INDEX "StepAssignment_userId_isActive_idx" ON "StepAssignment"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StepAssignment_stepId_userId_key" ON "StepAssignment"("stepId", "userId");

-- CreateIndex
CREATE INDEX "AutoActionRule_stepId_isActive_priority_idx" ON "AutoActionRule"("stepId", "isActive", "priority");

-- CreateIndex
CREATE INDEX "DelegationQuota_tenantId_eventId_idx" ON "DelegationQuota"("tenantId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "DelegationQuota_tenantId_eventId_organizationId_key" ON "DelegationQuota"("tenantId", "eventId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DelegationInvite_token_key" ON "DelegationInvite"("token");

-- CreateIndex
CREATE INDEX "DelegationInvite_quotaId_status_idx" ON "DelegationInvite"("quotaId", "status");

-- CreateIndex
CREATE INDEX "DelegationInvite_token_idx" ON "DelegationInvite"("token");

-- CreateIndex
CREATE INDEX "DelegationInvite_email_idx" ON "DelegationInvite"("email");

-- CreateIndex
CREATE INDEX "SavedView_tenantId_entityType_idx" ON "SavedView"("tenantId", "entityType");

-- CreateIndex
CREATE INDEX "SavedView_userId_idx" ON "SavedView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedView_tenantId_userId_name_entityType_key" ON "SavedView"("tenantId", "userId", "name", "entityType");

-- CreateIndex
CREATE INDEX "CustomObjectDefinition_tenantId_isActive_idx" ON "CustomObjectDefinition"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CustomObjectDefinition_tenantId_slug_key" ON "CustomObjectDefinition"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "CustomObjectRecord_definitionId_tenantId_idx" ON "CustomObjectRecord"("definitionId", "tenantId");

-- CreateIndex
CREATE INDEX "CustomObjectRecord_tenantId_idx" ON "CustomObjectRecord"("tenantId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_tenantId_metric_period_idx" ON "AnalyticsSnapshot"("tenantId", "metric", "period");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_tenantId_eventId_metric_idx" ON "AnalyticsSnapshot"("tenantId", "eventId", "metric");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_timestamp_idx" ON "AnalyticsSnapshot"("timestamp");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepAssignment" ADD CONSTRAINT "StepAssignment_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepAssignment" ADD CONSTRAINT "StepAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoActionRule" ADD CONSTRAINT "AutoActionRule_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegationQuota" ADD CONSTRAINT "DelegationQuota_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegationInvite" ADD CONSTRAINT "DelegationInvite_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "DelegationQuota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomObjectRecord" ADD CONSTRAINT "CustomObjectRecord_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "CustomObjectDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
