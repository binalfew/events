-- CreateEnum
CREATE TYPE "RoomBlockStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'RELEASED');

-- CreateEnum
CREATE TYPE "AccommodationAssignmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('AIRPORT_ARRIVAL', 'AIRPORT_DEPARTURE', 'INTER_VENUE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SEDAN', 'SUV', 'VAN', 'BUS', 'MINIBUS');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('SCHEDULED', 'EN_ROUTE', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'RECEPTION', 'COFFEE_BREAK', 'SNACK');

-- CreateEnum
CREATE TYPE "DietaryCategory" AS ENUM ('REGULAR', 'VEGETARIAN', 'VEGAN', 'HALAL', 'KOSHER', 'GLUTEN_FREE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ParkingPermitStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RoomBookingStatus" AS ENUM ('TENTATIVE', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SeatingPriority" AS ENUM ('HEAD_OF_STATE', 'MINISTER', 'AMBASSADOR', 'SENIOR_OFFICIAL', 'DELEGATE', 'OBSERVER', 'MEDIA');

-- CreateEnum
CREATE TYPE "BilateralStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CompanionType" AS ENUM ('SPOUSE', 'FAMILY', 'AIDE', 'SECURITY', 'INTERPRETER');

-- CreateEnum
CREATE TYPE "GiftDeliveryStatus" AS ENUM ('PENDING', 'ASSEMBLED', 'DELIVERED', 'RETURNED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('REPORTED', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('SCHEDULED', 'CHECKED_IN', 'ACTIVE', 'CHECKED_OUT', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('COORDINATOR', 'USHER', 'SECURITY', 'PROTOCOL', 'TECHNICAL', 'MEDICAL', 'TRANSPORT', 'CATERING');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('VALID', 'EXPIRING_SOON', 'EXPIRED', 'NOT_PROVIDED');

-- CreateEnum
CREATE TYPE "DataRetentionAction" AS ENUM ('RETAIN', 'ANONYMIZE', 'DELETE');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT', 'DOWNLOADED', 'REVOKED');

-- CreateTable
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "starRating" INTEGER,
    "totalRooms" INTEGER NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "distanceToVenue" TEXT,
    "amenities" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomBlock" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "participantTypeId" TEXT,
    "roomType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerNight" DOUBLE PRECISION,
    "status" "RoomBlockStatus" NOT NULL DEFAULT 'AVAILABLE',
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccommodationAssignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "roomBlockId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "roomNumber" TEXT,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "status" "AccommodationAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "specialRequests" TEXT,
    "notes" TEXT,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccommodationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRoute" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stops" JSONB NOT NULL DEFAULT '[]',
    "frequency" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "assignedTo" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "gpsTrackingId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "routeId" TEXT,
    "vehicleId" TEXT,
    "type" "TransferType" NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "TransferStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferPassenger" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "seatNumber" INTEGER,
    "boardedAt" TIMESTAMP(3),
    "droppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealSession" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "venue" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "menuNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealVoucher" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "mealSessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "dietaryCategory" "DietaryCategory" NOT NULL DEFAULT 'REGULAR',
    "qrCode" TEXT NOT NULL,
    "isRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "redeemedAt" TIMESTAMP(3),
    "redeemedBy" TEXT,
    "cancelledReason" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkingZone" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "occupancy" INTEGER NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "color" TEXT,
    "accessRules" JSONB NOT NULL DEFAULT '[]',
    "operatingHours" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParkingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkingPermit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "participantId" TEXT,
    "permitNumber" TEXT NOT NULL,
    "vehiclePlate" TEXT,
    "status" "ParkingPermitStatus" NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "issuedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParkingPermit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueMap" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "floorPlanUrl" TEXT,
    "mapData" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueRoom" (
    "id" TEXT NOT NULL,
    "venueMapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" TEXT,
    "capacity" INTEGER,
    "roomType" TEXT,
    "equipment" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomBooking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "RoomBookingStatus" NOT NULL DEFAULT 'TENTATIVE',
    "bookedBy" TEXT NOT NULL,
    "setup" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatingPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layoutType" TEXT NOT NULL,
    "layout" JSONB NOT NULL DEFAULT '{}',
    "totalSeats" INTEGER NOT NULL,
    "assignedSeats" INTEGER NOT NULL DEFAULT 0,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatingAssignment" (
    "id" TEXT NOT NULL,
    "seatingPlanId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "seatLabel" TEXT NOT NULL,
    "tableNumber" INTEGER,
    "priority" "SeatingPriority" NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatingConflict" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "seatingPlanId" TEXT,
    "participantAId" TEXT NOT NULL,
    "participantBId" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "description" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatingConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BilateralMeeting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesteeId" TEXT NOT NULL,
    "status" "BilateralStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedBy" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "roomId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 30,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BilateralMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingSlot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "meetingId" TEXT,
    "roomId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Companion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "primaryParticipantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "type" "CompanionType" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passportNumber" TEXT,
    "nationality" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "photoUrl" TEXT,
    "registrationCode" TEXT NOT NULL,
    "badgeTemplateId" TEXT,
    "extras" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanionActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "companionId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentSignups" INTEGER NOT NULL DEFAULT 0,
    "transportIncluded" BOOLEAN NOT NULL DEFAULT true,
    "cost" DOUBLE PRECISION DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanionActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "quantity" INTEGER NOT NULL,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelcomePackage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "forParticipantType" TEXT,
    "contents" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelcomePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftDelivery" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "giftItemId" TEXT,
    "welcomePackageId" TEXT,
    "participantId" TEXT,
    "recipientName" TEXT NOT NULL,
    "status" "GiftDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveredAt" TIMESTAMP(3),
    "deliveredBy" TEXT,
    "deliveryMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "location" TEXT,
    "reportedBy" TEXT NOT NULL,
    "assignedTo" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentUpdate" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEscalation" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "escalatedTo" TEXT NOT NULL,
    "escalatedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandCenterWidget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "widgetType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "gridX" INTEGER NOT NULL,
    "gridY" INTEGER NOT NULL,
    "gridW" INTEGER NOT NULL,
    "gridH" INTEGER NOT NULL,
    "refreshRate" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandCenterWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metric" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notifyRoles" TEXT[],
    "notifyUsers" TEXT[],
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "zone" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffShift" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "zone" TEXT,
    "requiredRole" "StaffRole",
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "assignedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "formTemplateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "participantId" TEXT,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'DRAFT',
    "fileUrl" TEXT,
    "qrCode" TEXT,
    "issuedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequirement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "participantTypes" TEXT[],
    "validityDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'NOT_PROVIDED',
    "expiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRetentionPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "action" "DataRetentionAction" NOT NULL DEFAULT 'ANONYMIZE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Hotel_eventId_idx" ON "Hotel"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Hotel_tenantId_eventId_name_key" ON "Hotel"("tenantId", "eventId", "name");

-- CreateIndex
CREATE INDEX "RoomBlock_hotelId_idx" ON "RoomBlock"("hotelId");

-- CreateIndex
CREATE INDEX "RoomBlock_status_idx" ON "RoomBlock"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AccommodationAssignment_participantId_key" ON "AccommodationAssignment"("participantId");

-- CreateIndex
CREATE INDEX "AccommodationAssignment_eventId_status_idx" ON "AccommodationAssignment"("eventId", "status");

-- CreateIndex
CREATE INDEX "AccommodationAssignment_roomBlockId_idx" ON "AccommodationAssignment"("roomBlockId");

-- CreateIndex
CREATE INDEX "TransportRoute_eventId_isActive_idx" ON "TransportRoute"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TransportRoute_tenantId_eventId_name_key" ON "TransportRoute"("tenantId", "eventId", "name");

-- CreateIndex
CREATE INDEX "Vehicle_eventId_isActive_idx" ON "Vehicle"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_tenantId_eventId_plateNumber_key" ON "Vehicle"("tenantId", "eventId", "plateNumber");

-- CreateIndex
CREATE INDEX "Transfer_eventId_scheduledAt_idx" ON "Transfer"("eventId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Transfer_status_idx" ON "Transfer"("status");

-- CreateIndex
CREATE INDEX "Transfer_vehicleId_idx" ON "Transfer"("vehicleId");

-- CreateIndex
CREATE INDEX "TransferPassenger_participantId_idx" ON "TransferPassenger"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferPassenger_transferId_participantId_key" ON "TransferPassenger"("transferId", "participantId");

-- CreateIndex
CREATE INDEX "MealPlan_eventId_idx" ON "MealPlan"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_tenantId_eventId_name_date_key" ON "MealPlan"("tenantId", "eventId", "name", "date");

-- CreateIndex
CREATE INDEX "MealSession_mealPlanId_mealType_idx" ON "MealSession"("mealPlanId", "mealType");

-- CreateIndex
CREATE UNIQUE INDEX "MealVoucher_qrCode_key" ON "MealVoucher"("qrCode");

-- CreateIndex
CREATE INDEX "MealVoucher_participantId_idx" ON "MealVoucher"("participantId");

-- CreateIndex
CREATE INDEX "MealVoucher_eventId_idx" ON "MealVoucher"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "MealVoucher_mealSessionId_participantId_key" ON "MealVoucher"("mealSessionId", "participantId");

-- CreateIndex
CREATE INDEX "ParkingZone_eventId_idx" ON "ParkingZone"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingZone_tenantId_eventId_code_key" ON "ParkingZone"("tenantId", "eventId", "code");

-- CreateIndex
CREATE INDEX "ParkingPermit_eventId_status_idx" ON "ParkingPermit"("eventId", "status");

-- CreateIndex
CREATE INDEX "ParkingPermit_participantId_idx" ON "ParkingPermit"("participantId");

-- CreateIndex
CREATE INDEX "ParkingPermit_zoneId_idx" ON "ParkingPermit"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingPermit_tenantId_eventId_permitNumber_key" ON "ParkingPermit"("tenantId", "eventId", "permitNumber");

-- CreateIndex
CREATE INDEX "VenueMap_eventId_idx" ON "VenueMap"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueMap_tenantId_eventId_name_key" ON "VenueMap"("tenantId", "eventId", "name");

-- CreateIndex
CREATE INDEX "VenueRoom_venueMapId_idx" ON "VenueRoom"("venueMapId");

-- CreateIndex
CREATE INDEX "RoomBooking_eventId_startTime_endTime_idx" ON "RoomBooking"("eventId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "RoomBooking_roomId_startTime_idx" ON "RoomBooking"("roomId", "startTime");

-- CreateIndex
CREATE INDEX "SeatingPlan_eventId_idx" ON "SeatingPlan"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatingPlan_tenantId_eventId_name_key" ON "SeatingPlan"("tenantId", "eventId", "name");

-- CreateIndex
CREATE INDEX "SeatingAssignment_participantId_idx" ON "SeatingAssignment"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatingAssignment_seatingPlanId_seatLabel_key" ON "SeatingAssignment"("seatingPlanId", "seatLabel");

-- CreateIndex
CREATE UNIQUE INDEX "SeatingAssignment_seatingPlanId_participantId_key" ON "SeatingAssignment"("seatingPlanId", "participantId");

-- CreateIndex
CREATE INDEX "SeatingConflict_eventId_isResolved_idx" ON "SeatingConflict"("eventId", "isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "SeatingConflict_tenantId_eventId_participantAId_participant_key" ON "SeatingConflict"("tenantId", "eventId", "participantAId", "participantBId");

-- CreateIndex
CREATE INDEX "BilateralMeeting_eventId_status_idx" ON "BilateralMeeting"("eventId", "status");

-- CreateIndex
CREATE INDEX "BilateralMeeting_requesterId_idx" ON "BilateralMeeting"("requesterId");

-- CreateIndex
CREATE INDEX "BilateralMeeting_requesteeId_idx" ON "BilateralMeeting"("requesteeId");

-- CreateIndex
CREATE UNIQUE INDEX "BilateralMeeting_tenantId_eventId_requesterId_requesteeId_key" ON "BilateralMeeting"("tenantId", "eventId", "requesterId", "requesteeId");

-- CreateIndex
CREATE INDEX "MeetingSlot_eventId_startTime_idx" ON "MeetingSlot"("eventId", "startTime");

-- CreateIndex
CREATE INDEX "MeetingSlot_meetingId_idx" ON "MeetingSlot"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingSlot_isBooked_idx" ON "MeetingSlot"("isBooked");

-- CreateIndex
CREATE UNIQUE INDEX "Companion_registrationCode_key" ON "Companion"("registrationCode");

-- CreateIndex
CREATE INDEX "Companion_eventId_primaryParticipantId_idx" ON "Companion"("eventId", "primaryParticipantId");

-- CreateIndex
CREATE INDEX "Companion_tenantId_eventId_idx" ON "Companion"("tenantId", "eventId");

-- CreateIndex
CREATE INDEX "CompanionActivity_eventId_date_idx" ON "CompanionActivity"("eventId", "date");

-- CreateIndex
CREATE INDEX "CompanionActivity_companionId_idx" ON "CompanionActivity"("companionId");

-- CreateIndex
CREATE INDEX "GiftItem_eventId_category_idx" ON "GiftItem"("eventId", "category");

-- CreateIndex
CREATE INDEX "WelcomePackage_eventId_idx" ON "WelcomePackage"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "WelcomePackage_tenantId_eventId_name_key" ON "WelcomePackage"("tenantId", "eventId", "name");

-- CreateIndex
CREATE INDEX "GiftDelivery_eventId_status_idx" ON "GiftDelivery"("eventId", "status");

-- CreateIndex
CREATE INDEX "GiftDelivery_participantId_idx" ON "GiftDelivery"("participantId");

-- CreateIndex
CREATE INDEX "GiftDelivery_giftItemId_idx" ON "GiftDelivery"("giftItemId");

-- CreateIndex
CREATE INDEX "Incident_eventId_severity_status_idx" ON "Incident"("eventId", "severity", "status");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_reportedBy_idx" ON "Incident"("reportedBy");

-- CreateIndex
CREATE INDEX "Incident_assignedTo_idx" ON "Incident"("assignedTo");

-- CreateIndex
CREATE INDEX "IncidentUpdate_incidentId_createdAt_idx" ON "IncidentUpdate"("incidentId", "createdAt");

-- CreateIndex
CREATE INDEX "IncidentEscalation_incidentId_idx" ON "IncidentEscalation"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentEscalation_escalatedTo_idx" ON "IncidentEscalation"("escalatedTo");

-- CreateIndex
CREATE INDEX "CommandCenterWidget_eventId_idx" ON "CommandCenterWidget"("eventId");

-- CreateIndex
CREATE INDEX "AlertRule_eventId_isActive_idx" ON "AlertRule"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AlertRule_tenantId_eventId_name_key" ON "AlertRule"("tenantId", "eventId", "name");

-- CreateIndex
CREATE INDEX "StaffMember_eventId_role_idx" ON "StaffMember"("eventId", "role");

-- CreateIndex
CREATE INDEX "StaffMember_eventId_isActive_idx" ON "StaffMember"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_userId_eventId_key" ON "StaffMember"("userId", "eventId");

-- CreateIndex
CREATE INDEX "StaffShift_eventId_date_idx" ON "StaffShift"("eventId", "date");

-- CreateIndex
CREATE INDEX "ShiftAssignment_staffMemberId_idx" ON "ShiftAssignment"("staffMemberId");

-- CreateIndex
CREATE INDEX "ShiftAssignment_status_idx" ON "ShiftAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_shiftId_staffMemberId_key" ON "ShiftAssignment"("shiftId", "staffMemberId");

-- CreateIndex
CREATE INDEX "Survey_eventId_status_idx" ON "Survey"("eventId", "status");

-- CreateIndex
CREATE INDEX "SurveyResponse_surveyId_idx" ON "SurveyResponse"("surveyId");

-- CreateIndex
CREATE INDEX "SurveyResponse_participantId_idx" ON "SurveyResponse"("participantId");

-- CreateIndex
CREATE INDEX "CertificateTemplate_tenantId_idx" ON "CertificateTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "CertificateTemplate_eventId_idx" ON "CertificateTemplate"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_qrCode_key" ON "Certificate"("qrCode");

-- CreateIndex
CREATE INDEX "Certificate_eventId_status_idx" ON "Certificate"("eventId", "status");

-- CreateIndex
CREATE INDEX "Certificate_participantId_idx" ON "Certificate"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_templateId_participantId_key" ON "Certificate"("templateId", "participantId");

-- CreateIndex
CREATE INDEX "DocumentRequirement_eventId_idx" ON "DocumentRequirement"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequirement_tenantId_eventId_name_key" ON "DocumentRequirement"("tenantId", "eventId", "name");

-- CreateIndex
CREATE INDEX "ParticipantDocument_participantId_idx" ON "ParticipantDocument"("participantId");

-- CreateIndex
CREATE INDEX "ParticipantDocument_status_idx" ON "ParticipantDocument"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantDocument_requirementId_participantId_key" ON "ParticipantDocument"("requirementId", "participantId");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_isActive_idx" ON "DataRetentionPolicy"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DataRetentionPolicy_tenantId_entityType_key" ON "DataRetentionPolicy"("tenantId", "entityType");

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBlock" ADD CONSTRAINT "RoomBlock_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationAssignment" ADD CONSTRAINT "AccommodationAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationAssignment" ADD CONSTRAINT "AccommodationAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationAssignment" ADD CONSTRAINT "AccommodationAssignment_roomBlockId_fkey" FOREIGN KEY ("roomBlockId") REFERENCES "RoomBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccommodationAssignment" ADD CONSTRAINT "AccommodationAssignment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferPassenger" ADD CONSTRAINT "TransferPassenger_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferPassenger" ADD CONSTRAINT "TransferPassenger_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealSession" ADD CONSTRAINT "MealSession_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealVoucher" ADD CONSTRAINT "MealVoucher_mealSessionId_fkey" FOREIGN KEY ("mealSessionId") REFERENCES "MealSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealVoucher" ADD CONSTRAINT "MealVoucher_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingZone" ADD CONSTRAINT "ParkingZone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingZone" ADD CONSTRAINT "ParkingZone_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingPermit" ADD CONSTRAINT "ParkingPermit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingPermit" ADD CONSTRAINT "ParkingPermit_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingPermit" ADD CONSTRAINT "ParkingPermit_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ParkingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingPermit" ADD CONSTRAINT "ParkingPermit_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueMap" ADD CONSTRAINT "VenueMap_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueMap" ADD CONSTRAINT "VenueMap_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueRoom" ADD CONSTRAINT "VenueRoom_venueMapId_fkey" FOREIGN KEY ("venueMapId") REFERENCES "VenueMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBooking" ADD CONSTRAINT "RoomBooking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBooking" ADD CONSTRAINT "RoomBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBooking" ADD CONSTRAINT "RoomBooking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "VenueRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomBooking" ADD CONSTRAINT "RoomBooking_bookedBy_fkey" FOREIGN KEY ("bookedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingPlan" ADD CONSTRAINT "SeatingPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingPlan" ADD CONSTRAINT "SeatingPlan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingAssignment" ADD CONSTRAINT "SeatingAssignment_seatingPlanId_fkey" FOREIGN KEY ("seatingPlanId") REFERENCES "SeatingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingAssignment" ADD CONSTRAINT "SeatingAssignment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingAssignment" ADD CONSTRAINT "SeatingAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingConflict" ADD CONSTRAINT "SeatingConflict_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilateralMeeting" ADD CONSTRAINT "BilateralMeeting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilateralMeeting" ADD CONSTRAINT "BilateralMeeting_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilateralMeeting" ADD CONSTRAINT "BilateralMeeting_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilateralMeeting" ADD CONSTRAINT "BilateralMeeting_requesteeId_fkey" FOREIGN KEY ("requesteeId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BilateralMeeting" ADD CONSTRAINT "BilateralMeeting_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingSlot" ADD CONSTRAINT "MeetingSlot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingSlot" ADD CONSTRAINT "MeetingSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingSlot" ADD CONSTRAINT "MeetingSlot_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "BilateralMeeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_primaryParticipantId_fkey" FOREIGN KEY ("primaryParticipantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionActivity" ADD CONSTRAINT "CompanionActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionActivity" ADD CONSTRAINT "CompanionActivity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionActivity" ADD CONSTRAINT "CompanionActivity_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelcomePackage" ADD CONSTRAINT "WelcomePackage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelcomePackage" ADD CONSTRAINT "WelcomePackage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftDelivery" ADD CONSTRAINT "GiftDelivery_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftDelivery" ADD CONSTRAINT "GiftDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftDelivery" ADD CONSTRAINT "GiftDelivery_giftItemId_fkey" FOREIGN KEY ("giftItemId") REFERENCES "GiftItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftDelivery" ADD CONSTRAINT "GiftDelivery_welcomePackageId_fkey" FOREIGN KEY ("welcomePackageId") REFERENCES "WelcomePackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftDelivery" ADD CONSTRAINT "GiftDelivery_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftDelivery" ADD CONSTRAINT "GiftDelivery_deliveredBy_fkey" FOREIGN KEY ("deliveredBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentUpdate" ADD CONSTRAINT "IncidentUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentUpdate" ADD CONSTRAINT "IncidentUpdate_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEscalation" ADD CONSTRAINT "IncidentEscalation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEscalation" ADD CONSTRAINT "IncidentEscalation_escalatedTo_fkey" FOREIGN KEY ("escalatedTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEscalation" ADD CONSTRAINT "IncidentEscalation_escalatedBy_fkey" FOREIGN KEY ("escalatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandCenterWidget" ADD CONSTRAINT "CommandCenterWidget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandCenterWidget" ADD CONSTRAINT "CommandCenterWidget_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "StaffShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateTemplate" ADD CONSTRAINT "CertificateTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateTemplate" ADD CONSTRAINT "CertificateTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequirement" ADD CONSTRAINT "DocumentRequirement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequirement" ADD CONSTRAINT "DocumentRequirement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantDocument" ADD CONSTRAINT "ParticipantDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantDocument" ADD CONSTRAINT "ParticipantDocument_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DocumentRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantDocument" ADD CONSTRAINT "ParticipantDocument_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantDocument" ADD CONSTRAINT "ParticipantDocument_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRetentionPolicy" ADD CONSTRAINT "DataRetentionPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
