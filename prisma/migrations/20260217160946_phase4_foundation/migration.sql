-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RateLimitTier" AS ENUM ('STANDARD', 'ELEVATED', 'PREMIUM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('QR_SCAN', 'NFC_TAP', 'MANUAL_ENTRY');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('VALID', 'INVALID', 'EXPIRED', 'REVOKED', 'ALREADY_SCANNED', 'MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "BulkOperationType" AS ENUM ('IMPORT_PARTICIPANTS', 'EXPORT_PARTICIPANTS', 'STATUS_CHANGE', 'BULK_APPROVE', 'BULK_REJECT', 'BULK_BYPASS', 'FIELD_UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "BulkOperationStatus" AS ENUM ('VALIDATING', 'PREVIEW', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "DuplicateStatus" AS ENUM ('PENDING_REVIEW', 'CONFIRMED_DUPLICATE', 'NOT_DUPLICATE', 'MERGED');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('ACTIVE', 'PROMOTED', 'EXPIRED', 'WITHDRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WaitlistPriority" AS ENUM ('STANDARD', 'HIGH', 'VIP');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CloneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'CALLED', 'SERVING', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "StepType" ADD VALUE 'JOIN';

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "permissions" TEXT[],
    "scopes" JSONB,
    "rateLimitTier" "RateLimitTier" NOT NULL DEFAULT 'STANDARD',
    "rateLimitCustom" INTEGER,
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "lastUsedIp" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "allowedIps" TEXT[],
    "allowedOrigins" TEXT[],
    "rotatedFromId" TEXT,
    "rotationGraceEnd" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "events" TEXT[],
    "secret" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" TEXT NOT NULL DEFAULT 'v1',
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "retryBackoffMs" INTEGER[] DEFAULT ARRAY[1000, 5000, 30000, 300000, 1800000]::INTEGER[],
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "circuitBreakerOpen" BOOLEAN NOT NULL DEFAULT false,
    "circuitBreakerResetAt" TIMESTAMP(3),
    "headers" JSONB,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "responseHeaders" JSONB,
    "latencyMs" INTEGER,
    "errorMessage" TEXT,
    "errorType" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "participantId" TEXT,
    "scanType" "ScanType" NOT NULL,
    "scanResult" "ScanResult" NOT NULL,
    "qrPayload" TEXT NOT NULL,
    "scannedBy" TEXT NOT NULL,
    "deviceId" TEXT,
    "overrideReason" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueOccupancy" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "zoneId" TEXT,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "maxCapacity" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueOccupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KioskDevice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "language" TEXT NOT NULL DEFAULT 'en',
    "mode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KioskDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KioskSession" (
    "id" TEXT NOT NULL,
    "kioskDeviceId" TEXT NOT NULL,
    "participantId" TEXT,
    "sessionType" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "timedOut" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "KioskSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueTicket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "counterNumber" INTEGER,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "estimatedWait" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "servedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "QueueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOperation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "BulkOperationType" NOT NULL,
    "status" "BulkOperationStatus" NOT NULL DEFAULT 'VALIDATING',
    "description" TEXT NOT NULL,
    "filters" JSONB,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "inputFileUrl" TEXT,
    "outputFileUrl" TEXT,
    "snapshotData" JSONB,
    "undoDeadline" TIMESTAMP(3),
    "errorLog" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOperationItem" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "participantId" TEXT,
    "rowNumber" INTEGER,
    "status" TEXT NOT NULL,
    "inputData" JSONB,
    "previousState" JSONB,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "BulkOperationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateCandidate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT,
    "participantAId" TEXT NOT NULL,
    "participantBId" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "matchFields" JSONB NOT NULL,
    "status" "DuplicateStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MergeHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "survivingId" TEXT NOT NULL,
    "mergedId" TEXT NOT NULL,
    "fieldResolution" JSONB NOT NULL,
    "approvalsMigrated" INTEGER NOT NULL,
    "mergedBy" TEXT NOT NULL,
    "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MergeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blacklist" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "nameVariations" TEXT[],
    "passportNumber" TEXT,
    "email" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "organization" TEXT,
    "reason" TEXT NOT NULL,
    "source" TEXT,
    "addedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "participantType" TEXT NOT NULL,
    "priority" "WaitlistPriority" NOT NULL DEFAULT 'STANDARD',
    "position" INTEGER NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'ACTIVE',
    "registrationData" JSONB NOT NULL,
    "promotedAt" TIMESTAMP(3),
    "promotionDeadline" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "notificationsSent" INTEGER NOT NULL DEFAULT 0,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistPromotion" (
    "id" TEXT NOT NULL,
    "waitlistEntryId" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "triggerEntityId" TEXT,
    "promotedBy" TEXT,
    "slotAvailableAt" TIMESTAMP(3) NOT NULL,
    "promotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),

    CONSTRAINT "WaitlistPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "variables" TEXT[],
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "filters" JSONB NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "bouncedCount" INTEGER NOT NULL DEFAULT 0,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageDelivery" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "externalId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSeries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEdition" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "editionNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "hostCountry" TEXT,
    "hostCity" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloneOperation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "targetEventId" TEXT,
    "status" "CloneStatus" NOT NULL DEFAULT 'PENDING',
    "options" JSONB NOT NULL,
    "elementsCopied" JSONB,
    "errorLog" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "CloneOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParallelBranch" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "forkStepId" TEXT NOT NULL,
    "branchStepId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "action" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParallelBranch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_rotatedFromId_key" ON "ApiKey"("rotatedFromId");

-- CreateIndex
CREATE INDEX "ApiKey_tenantId_status_idx" ON "ApiKey"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "WebhookSubscription_tenantId_status_idx" ON "WebhookSubscription"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_subscriptionId_status_idx" ON "WebhookDelivery"("subscriptionId", "status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_tenantId_eventType_createdAt_idx" ON "WebhookDelivery"("tenantId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_nextRetryAt_idx" ON "WebhookDelivery"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_eventId_idx" ON "WebhookDelivery"("eventId");

-- CreateIndex
CREATE INDEX "Checkpoint_eventId_isActive_idx" ON "Checkpoint"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Checkpoint_tenantId_eventId_name_key" ON "Checkpoint"("tenantId", "eventId", "name");

-- CreateIndex
CREATE INDEX "AccessLog_checkpointId_scannedAt_idx" ON "AccessLog"("checkpointId", "scannedAt");

-- CreateIndex
CREATE INDEX "AccessLog_participantId_scannedAt_idx" ON "AccessLog"("participantId", "scannedAt");

-- CreateIndex
CREATE INDEX "AccessLog_scanResult_scannedAt_idx" ON "AccessLog"("scanResult", "scannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VenueOccupancy_eventId_zoneId_key" ON "VenueOccupancy"("eventId", "zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "KioskDevice_tenantId_eventId_name_key" ON "KioskDevice"("tenantId", "eventId", "name");

-- CreateIndex
CREATE INDEX "KioskSession_kioskDeviceId_startedAt_idx" ON "KioskSession"("kioskDeviceId", "startedAt");

-- CreateIndex
CREATE INDEX "KioskSession_participantId_idx" ON "KioskSession"("participantId");

-- CreateIndex
CREATE INDEX "QueueTicket_eventId_status_priority_idx" ON "QueueTicket"("eventId", "status", "priority");

-- CreateIndex
CREATE INDEX "QueueTicket_participantId_idx" ON "QueueTicket"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "QueueTicket_tenantId_eventId_ticketNumber_key" ON "QueueTicket"("tenantId", "eventId", "ticketNumber");

-- CreateIndex
CREATE INDEX "BulkOperation_tenantId_eventId_status_idx" ON "BulkOperation"("tenantId", "eventId", "status");

-- CreateIndex
CREATE INDEX "BulkOperation_tenantId_eventId_type_createdAt_idx" ON "BulkOperation"("tenantId", "eventId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "BulkOperationItem_operationId_status_idx" ON "BulkOperationItem"("operationId", "status");

-- CreateIndex
CREATE INDEX "DuplicateCandidate_tenantId_eventId_status_idx" ON "DuplicateCandidate"("tenantId", "eventId", "status");

-- CreateIndex
CREATE INDEX "DuplicateCandidate_confidenceScore_idx" ON "DuplicateCandidate"("confidenceScore");

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateCandidate_participantAId_participantBId_key" ON "DuplicateCandidate"("participantAId", "participantBId");

-- CreateIndex
CREATE INDEX "MergeHistory_survivingId_idx" ON "MergeHistory"("survivingId");

-- CreateIndex
CREATE INDEX "MergeHistory_mergedId_idx" ON "MergeHistory"("mergedId");

-- CreateIndex
CREATE INDEX "Blacklist_passportNumber_idx" ON "Blacklist"("passportNumber");

-- CreateIndex
CREATE INDEX "Blacklist_email_idx" ON "Blacklist"("email");

-- CreateIndex
CREATE INDEX "Blacklist_isActive_idx" ON "Blacklist"("isActive");

-- CreateIndex
CREATE INDEX "Blacklist_name_idx" ON "Blacklist"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_participantId_key" ON "WaitlistEntry"("participantId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_eventId_participantType_priority_position_idx" ON "WaitlistEntry"("eventId", "participantType", "priority", "position");

-- CreateIndex
CREATE INDEX "WaitlistEntry_eventId_status_idx" ON "WaitlistEntry"("eventId", "status");

-- CreateIndex
CREATE INDEX "WaitlistEntry_status_promotionDeadline_idx" ON "WaitlistEntry"("status", "promotionDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_eventId_participantId_key" ON "WaitlistEntry"("eventId", "participantId");

-- CreateIndex
CREATE INDEX "WaitlistPromotion_waitlistEntryId_idx" ON "WaitlistPromotion"("waitlistEntryId");

-- CreateIndex
CREATE INDEX "MessageTemplate_tenantId_idx" ON "MessageTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "MessageTemplate_channel_idx" ON "MessageTemplate"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_tenantId_name_channel_key" ON "MessageTemplate"("tenantId", "name", "channel");

-- CreateIndex
CREATE INDEX "BroadcastMessage_tenantId_idx" ON "BroadcastMessage"("tenantId");

-- CreateIndex
CREATE INDEX "BroadcastMessage_eventId_idx" ON "BroadcastMessage"("eventId");

-- CreateIndex
CREATE INDEX "BroadcastMessage_status_idx" ON "BroadcastMessage"("status");

-- CreateIndex
CREATE INDEX "BroadcastMessage_scheduledAt_idx" ON "BroadcastMessage"("scheduledAt");

-- CreateIndex
CREATE INDEX "MessageDelivery_broadcastId_idx" ON "MessageDelivery"("broadcastId");

-- CreateIndex
CREATE INDEX "MessageDelivery_participantId_idx" ON "MessageDelivery"("participantId");

-- CreateIndex
CREATE INDEX "MessageDelivery_status_idx" ON "MessageDelivery"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MessageDelivery_broadcastId_participantId_channel_key" ON "MessageDelivery"("broadcastId", "participantId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "EventSeries_tenantId_name_key" ON "EventSeries"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EventEdition_eventId_key" ON "EventEdition"("eventId");

-- CreateIndex
CREATE INDEX "EventEdition_seriesId_year_idx" ON "EventEdition"("seriesId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "EventEdition_seriesId_editionNumber_key" ON "EventEdition"("seriesId", "editionNumber");

-- CreateIndex
CREATE INDEX "CloneOperation_tenantId_status_idx" ON "CloneOperation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ParallelBranch_participantId_forkStepId_idx" ON "ParallelBranch"("participantId", "forkStepId");

-- CreateIndex
CREATE INDEX "ParallelBranch_status_idx" ON "ParallelBranch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ParallelBranch_participantId_forkStepId_branchStepId_key" ON "ParallelBranch"("participantId", "forkStepId", "branchStepId");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_rotatedFromId_fkey" FOREIGN KEY ("rotatedFromId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookSubscription" ADD CONSTRAINT "WebhookSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkpoint" ADD CONSTRAINT "Checkpoint_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "Checkpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueOccupancy" ADD CONSTRAINT "VenueOccupancy_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KioskDevice" ADD CONSTRAINT "KioskDevice_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KioskSession" ADD CONSTRAINT "KioskSession_kioskDeviceId_fkey" FOREIGN KEY ("kioskDeviceId") REFERENCES "KioskDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueTicket" ADD CONSTRAINT "QueueTicket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueTicket" ADD CONSTRAINT "QueueTicket_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperation" ADD CONSTRAINT "BulkOperation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperationItem" ADD CONSTRAINT "BulkOperationItem_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "BulkOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistPromotion" ADD CONSTRAINT "WaitlistPromotion_waitlistEntryId_fkey" FOREIGN KEY ("waitlistEntryId") REFERENCES "WaitlistEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastMessage" ADD CONSTRAINT "BroadcastMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastMessage" ADD CONSTRAINT "BroadcastMessage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastMessage" ADD CONSTRAINT "BroadcastMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDelivery" ADD CONSTRAINT "MessageDelivery_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "BroadcastMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDelivery" ADD CONSTRAINT "MessageDelivery_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSeries" ADD CONSTRAINT "EventSeries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEdition" ADD CONSTRAINT "EventEdition_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "EventSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEdition" ADD CONSTRAINT "EventEdition_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParallelBranch" ADD CONSTRAINT "ParallelBranch_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParallelBranch" ADD CONSTRAINT "ParallelBranch_branchStepId_fkey" FOREIGN KEY ("branchStepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
