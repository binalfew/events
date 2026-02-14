# Module 11: Logistics and Venue Management

> **Module:** 11 - Logistics and Venue Management
> **Version:** 1.0
> **Last Updated:** February 13, 2026
> **Status:** Draft
> **Requires:** [Module 01: Data Model Foundation](./01-DATA-MODEL-FOUNDATION.md), [Module 05: Security & Access Control](./05-SECURITY-AND-ACCESS-CONTROL.md)
> **Required By:** [Module 10: Event Operations Center](./10-EVENT-OPERATIONS-CENTER.md), [Module 12: Protocol & Diplomacy](./12-PROTOCOL-AND-DIPLOMACY.md)
> **Integrates With:** [Module 09: Registration & Accreditation](./09-REGISTRATION-AND-ACCREDITATION.md), [Module 13: People & Workforce](./13-PEOPLE-AND-WORKFORCE.md), [Module 07: API & Integration Layer](./07-API-AND-INTEGRATION-LAYER.md)

---

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Key Personas](#13-key-personas)
   - 1.4 [Logistics Domain Map](#14-logistics-domain-map)
2. [Architecture](#2-architecture)
   - 2.1 [Logistics Coordination Platform Architecture](#21-logistics-coordination-platform-architecture)
   - 2.2 [Shared Location & Capacity Service](#22-shared-location--capacity-service)
   - 2.3 [Real-Time Vehicle Tracking Subsystem](#23-real-time-vehicle-tracking-subsystem)
   - 2.4 [Capacity Planning Engine](#24-capacity-planning-engine)
   - 2.5 [Venue Rendering Engine](#25-venue-rendering-engine)
3. [Data Model](#3-data-model)
   - 3.1 [Accommodation Models](#31-accommodation-models)
   - 3.2 [Transportation Models](#32-transportation-models)
   - 3.3 [Catering & Meal Models](#33-catering--meal-models)
   - 3.4 [Parking & Zone Access Models](#34-parking--zone-access-models)
   - 3.5 [Venue & Floor Plan Models](#35-venue--floor-plan-models)
   - 3.6 [Multi-Venue Zone Models](#36-multi-venue-zone-models)
   - 3.7 [Vendor Management Model](#37-vendor-management-model)
   - 3.8 [Capacity Plan Model](#38-capacity-plan-model)
   - 3.9 [Entity Relationship Diagram](#39-entity-relationship-diagram)
   - 3.10 [Index Catalog](#310-index-catalog)
4. [API Specification](#4-api-specification)
   - 4.1 [Accommodation API](#41-accommodation-api)
   - 4.2 [Transportation API](#42-transportation-api)
   - 4.3 [Catering API](#43-catering-api)
   - 4.4 [Parking API](#44-parking-api)
   - 4.5 [Venue & Floor Plan API](#45-venue--floor-plan-api)
   - 4.6 [Zone Coordination API](#46-zone-coordination-api)
   - 4.7 [Vendor Management API](#47-vendor-management-api)
5. [Business Logic](#5-business-logic)
   - 5.1 [Room Assignment Optimization](#51-room-assignment-optimization)
   - 5.2 [Transport Route Optimization](#52-transport-route-optimization)
   - 5.3 [Meal Count Forecasting](#53-meal-count-forecasting)
   - 5.4 [Parking Space Allocation](#54-parking-space-allocation)
   - 5.5 [Interactive Floor Plan Editor](#55-interactive-floor-plan-editor)
   - 5.6 [Multi-Venue Zone Coordination](#56-multi-venue-zone-coordination)
   - 5.7 [Vendor Management Logic](#57-vendor-management-logic)
   - 5.8 [Capacity Planning Engine](#58-capacity-planning-engine)
6. [User Interface](#6-user-interface)
   - 6.1 [Accommodation Dashboard](#61-accommodation-dashboard)
   - 6.2 [Transport Schedule Board](#62-transport-schedule-board)
   - 6.3 [Catering Service Point Interface](#63-catering-service-point-interface)
   - 6.4 [Parking Management Map](#64-parking-management-map)
   - 6.5 [Interactive Venue Floor Plan Editor](#65-interactive-venue-floor-plan-editor)
   - 6.6 [Multi-Venue Overview Map](#66-multi-venue-overview-map)
   - 6.7 [Vendor Management Console](#67-vendor-management-console)
7. [Integration Points](#7-integration-points)
   - 7.1 [Registration Data for Logistics Planning](#71-registration-data-for-logistics-planning)
   - 7.2 [Check-In Data for Meal Counts](#72-check-in-data-for-meal-counts)
   - 7.3 [Protocol Requirements for VIP Logistics](#73-protocol-requirements-for-vip-logistics)
   - 7.4 [Workforce Deployment for Logistics Staff](#74-workforce-deployment-for-logistics-staff)
   - 7.5 [Communication for Logistics Notifications](#75-communication-for-logistics-notifications)
   - 7.6 [Cross-Domain Integration Matrix](#76-cross-domain-integration-matrix)
8. [Configuration](#8-configuration)
   - 8.1 [Feature Flags per Logistics Domain](#81-feature-flags-per-logistics-domain)
   - 8.2 [Capacity Thresholds](#82-capacity-thresholds)
   - 8.3 [Meal Service Windows](#83-meal-service-windows)
   - 8.4 [Parking Zone Definitions](#84-parking-zone-definitions)
   - 8.5 [Floor Plan Upload Limits](#85-floor-plan-upload-limits)
   - 8.6 [Shuttle Scheduling Parameters](#86-shuttle-scheduling-parameters)
9. [Testing Strategy](#9-testing-strategy)
   - 9.1 [Room Assignment Optimization Tests](#91-room-assignment-optimization-tests)
   - 9.2 [Transport Scheduling Tests](#92-transport-scheduling-tests)
   - 9.3 [Meal Forecasting Accuracy Tests](#93-meal-forecasting-accuracy-tests)
   - 9.4 [Floor Plan Rendering Tests](#94-floor-plan-rendering-tests)
   - 9.5 [Parking Availability Real-Time Update Tests](#95-parking-availability-real-time-update-tests)
   - 9.6 [Integration & E2E Tests](#96-integration--e2e-tests)
10. [Security Considerations](#10-security-considerations)
    - 10.1 [Vendor Data Isolation](#101-vendor-data-isolation)
    - 10.2 [PII in Transport Manifests](#102-pii-in-transport-manifests)
    - 10.3 [Location Data Privacy](#103-location-data-privacy)
    - 10.4 [Room Assignment Confidentiality](#104-room-assignment-confidentiality)
    - 10.5 [Parking Permit Validation](#105-parking-permit-validation)
11. [Performance Requirements](#11-performance-requirements)
    - 11.1 [Floor Plan Rendering Targets](#111-floor-plan-rendering-targets)
    - 11.2 [Real-Time Vehicle Tracking](#112-real-time-vehicle-tracking)
    - 11.3 [Meal Service Throughput](#113-meal-service-throughput)
    - 11.4 [Parking Availability Query](#114-parking-availability-query)
    - 11.5 [Room Assignment Optimization](#115-room-assignment-optimization)
    - 11.6 [Performance Budget Summary](#116-performance-budget-summary)
12. [Open Questions & Decisions](#12-open-questions--decisions)

- [Appendix](#appendix)
  - A. [Glossary](#a-glossary)
  - B. [References](#b-references)
  - C. [Logistics Domain Interaction Matrix](#c-logistics-domain-interaction-matrix)

---

## 1. Overview

### 1.1 Purpose

The Logistics and Venue Management module provides a **unified logistics coordination platform** covering six operational domains that are essential for multi-day diplomatic events:

1. **Accommodation** -- Hotel block booking, room assignment, and rooming list generation for delegates, ministers, and heads of state across multiple hotels.
2. **Transportation** -- Airport pickup scheduling, inter-venue shuttles, VIP motorcades, fleet tracking, and driver dispatch for hundreds of participants.
3. **Catering** -- Meal plan creation, dietary requirement aggregation, QR-based voucher scanning, real-time consumption tracking, and vendor dashboards.
4. **Parking** -- Zone-based parking management with permit issuance, gate scanning, real-time occupancy tracking, and car pass design.
5. **Venue & Floor Plans** -- Room booking calendars, interactive floor plan editing, equipment tracking, and room setup task generation.
6. **Multi-Venue Zones** -- Zone access control, inter-zone shuttle coordination, travel time calculations, and central command center aggregation.

Multi-day diplomatic events require housing coordination for hundreds of delegates. Protocol dictates that heads of state receive presidential suites, ministers get executive rooms, and support staff share standard rooms. Hotels are block-booked months in advance, and room assignments must balance protocol rank, delegation preferences, and availability. Without a dedicated system, coordinators juggle spreadsheets across multiple hotels, losing track of no-shows, late arrivals, and room changes. Integrating accommodation into the accreditation platform connects housing to participant data -- when a participant is approved, their room is auto-assigned; when they're rejected, the room is released.

Coordinating airport pickups, inter-venue shuttles, and VIP motorcades for hundreds of delegates is one of the most operationally complex aspects of large events. A minister's flight lands at 14:30, their bilateral meeting starts at 16:00, and the hotel is 30 minutes from the venue. The system must auto-schedule a pickup, assign a vehicle, notify the driver, track the trip, and alert operations if the delegate hasn't been picked up by 15:00. Without integration, logistics coordinators work from printouts of flight data, manually calling drivers.

Multi-day diplomatic events serve thousands of meals across breakfast, lunch, dinner, coffee breaks, and VIP receptions. Each meal must accommodate diverse dietary requirements driven by cultural, religious, and medical needs. Without a dedicated catering system, organizers rely on spreadsheet estimates and manual headcounts, leading to food waste on one end and shortages on the other. Integrating catering into the accreditation platform means dietary data flows directly from participant registration into kitchen production orders, and QR-based voucher scanning provides real-time consumption data that caterers can act on mid-service.

Large events have multiple controlled parking zones with different access levels -- VIP lot, delegate parking, staff parking, media compound, service vehicles. The platform manages permit issuance, gate scanning flows, and real-time occupancy tracking to prevent zone overflow.

### 1.2 Scope

This module covers the complete logistics lifecycle from pre-event planning through real-time operations to post-event reporting:

| Phase                       | Domains Covered                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Pre-Event Planning**      | Hotel block booking, fleet procurement, meal plan design, parking zone setup, venue floor plan upload, zone definition  |
| **Assignment & Scheduling** | Room auto-assignment, transport request creation, voucher generation, permit issuance, room booking, shuttle scheduling |
| **Real-Time Operations**    | Check-in/check-out tracking, vehicle GPS tracking, meal scanning, gate scanning, room status updates, zone occupancy    |
| **Post-Event Reporting**    | Occupancy analytics, fleet utilization, meal consumption vs. waste, parking usage patterns, vendor performance          |

**Out of Scope:**

- Financial billing and invoicing (handled by Budget module)
- Protocol rank definitions (handled by Module 12: Protocol & Diplomacy)
- Staff shift management (handled by Module 13: People & Workforce)
- Communication dispatch (handled by Module 14: Communication Hub)

### 1.3 Key Personas

| Persona                   | Role                                                                                 | Primary Domains |
| ------------------------- | ------------------------------------------------------------------------------------ | --------------- |
| **Logistics Coordinator** | Oversees all logistics operations; manages cross-domain dependencies and escalations | All six domains |
| **Venue Manager**         | Manages venue spaces, floor plans, room bookings, and on-site setup tasks            | Venue, Zones    |
| **Catering Manager**      | Designs meal plans, manages dietary aggregation, monitors real-time consumption      | Catering        |
| **Transport Dispatcher**  | Manages fleet, assigns vehicles and drivers, monitors pickups and shuttles           | Transportation  |
| **Parking Attendant**     | Scans car passes at gates, monitors zone occupancy, directs overflow                 | Parking         |
| **Hotel Liaison**         | Coordinates with hotel block bookings, rooming lists, special requests               | Accommodation   |
| **Vendor Representative** | Read-only access to relevant logistics data (catering counts, delivery schedules)    | Vendor Portal   |
| **Zone Manager**          | Manages a specific event zone; monitors occupancy, staff, and incidents              | Zones           |

### 1.4 Logistics Domain Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LOGISTICS & VENUE MANAGEMENT                         │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │
│  │ACCOMMODATION│  │TRANSPORTATION│  │  CATERING   │                    │
│  │             │  │             │  │             │                      │
│  │ Hotels      │  │ Fleet       │  │ Meal Plans  │                     │
│  │ Room Blocks │  │ Routes      │  │ Dietary     │                     │
│  │ Assignments │  │ Trips       │  │ Vouchers    │                     │
│  │ Rooming List│  │ Shuttles    │  │ Scanning    │                     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                    │
│         │                │                │                             │
│         └────────────────┼────────────────┘                            │
│                          │                                              │
│              ┌───────────┴───────────┐                                  │
│              │  SHARED SERVICES      │                                  │
│              │  - Location/Capacity  │                                  │
│              │  - Vendor Management  │                                  │
│              │  - Capacity Planning  │                                  │
│              └───────────┬───────────┘                                  │
│                          │                                              │
│         ┌────────────────┼────────────────┐                            │
│         │                │                │                             │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐                    │
│  │   PARKING   │  │VENUE/FLOORS │  │ MULTI-VENUE │                    │
│  │             │  │             │  │   ZONES     │                     │
│  │ Zones       │  │ Buildings   │  │ Zone Defs   │                     │
│  │ Permits     │  │ Floor Plans │  │ Travel Times│                     │
│  │ Gate Logs   │  │ Room Book.  │  │ Shuttles    │                     │
│  │ Occupancy   │  │ Equipment   │  │ Access Ctrl │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture

### 2.1 Logistics Coordination Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Logistics │  │ Venue    │  │ Catering │  │Transport │  │ Parking  │     │
│  │Dashboard │  │ Editor   │  │ Scanner  │  │ Tracker  │  │ Gate App │     │
│  │ (Web)    │  │ (Web)    │  │ (Mobile) │  │ (Mobile) │  │ (Tablet) │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       └──────────────┴──────────────┴──────────────┴──────────────┘         │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS / WSS
┌───────────────────────────────────┴─────────────────────────────────────────┐
│                          API GATEWAY                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Rate Limiting  │  Auth (JWT)  │  Tenant Resolution  │  Routing    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴─────────────────────────────────────────┐
│                      LOGISTICS SERVICE LAYER                                 │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │Accommodation │  │ Transport    │  │  Catering    │                      │
│  │   Service    │  │   Service    │  │   Service    │                      │
│  │              │  │              │  │              │                       │
│  │- Room Assign │  │- Fleet Mgmt  │  │- Meal Plans  │                      │
│  │- Block Mgmt  │  │- Route Optim │  │- Voucher Gen │                      │
│  │- Rooming List│  │- Trip Track  │  │- Diet Agg    │                      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                      │
│         │                 │                  │                               │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐                      │
│  │   Parking    │  │    Venue     │  │    Zone      │                      │
│  │   Service    │  │   Service    │  │   Service    │                      │
│  │              │  │              │  │              │                       │
│  │- Permits     │  │- Floor Plans │  │- Access Ctrl │                      │
│  │- Gate Scan   │  │- Room Book   │  │- Shuttles    │                      │
│  │- Occupancy   │  │- Capacity    │  │- Travel Time │                      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                      │
│         │                 │                  │                               │
│  ┌──────┴─────────────────┴──────────────────┴───────┐                      │
│  │              SHARED SERVICES                       │                      │
│  │  ┌────────────────┐  ┌─────────────────────────┐  │                      │
│  │  │ Location &     │  │ Capacity Planning       │  │                      │
│  │  │ Capacity Svc   │  │ Engine                  │  │                      │
│  │  └────────────────┘  └─────────────────────────┘  │                      │
│  │  ┌────────────────┐  ┌─────────────────────────┐  │                      │
│  │  │ Vendor Mgmt    │  │ Venue Rendering         │  │                      │
│  │  │ Service        │  │ Engine                  │  │                      │
│  │  └────────────────┘  └─────────────────────────┘  │                      │
│  └───────────────────────────────────────────────────┘                      │
│                                                                              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴─────────────────────────────────────────┐
│                          DATA & EVENT LAYER                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ PostgreSQL │  │   Redis    │  │ Azure Blob │  │  EventBus  │           │
│  │ (Primary)  │  │ (Cache +   │  │ (Floor     │  │ (Domain    │           │
│  │            │  │  Real-time)│  │  Plans)    │  │  Events)   │           │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Shared Location & Capacity Service

The shared location and capacity service provides a unified abstraction over all physical spaces managed across the six logistics domains. Every hotel, venue, parking zone, and catering point is registered as a `LogisticsLocation` with standardized capacity tracking.

```typescript
// src/logistics/shared/location-capacity.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";

interface LocationCapacity {
  locationId: string;
  locationType: "HOTEL" | "VENUE" | "PARKING_ZONE" | "CATERING_POINT" | "ZONE";
  name: string;
  totalCapacity: number;
  currentOccupancy: number;
  availableCapacity: number;
  utilizationPercent: number;
  thresholdStatus: "NORMAL" | "WARNING" | "CRITICAL" | "FULL";
}

interface CapacityThresholds {
  warningPercent: number; // default 80
  criticalPercent: number; // default 95
}

@Injectable()
export class LocationCapacityService {
  private readonly CACHE_PREFIX = "logistics:capacity:";
  private readonly CACHE_TTL = 30; // seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getCapacity(
    tenantId: string,
    eventId: string,
    locationType: string,
    locationId: string,
  ): Promise<LocationCapacity> {
    const cacheKey = `${this.CACHE_PREFIX}${tenantId}:${eventId}:${locationType}:${locationId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const capacity = await this.calculateCapacity(tenantId, eventId, locationType, locationId);
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(capacity));
    return capacity;
  }

  async getAllCapacities(tenantId: string, eventId: string): Promise<LocationCapacity[]> {
    const [hotels, parkingZones, venues, eventZones] = await Promise.all([
      this.getHotelCapacities(tenantId, eventId),
      this.getParkingCapacities(tenantId, eventId),
      this.getVenueCapacities(tenantId, eventId),
      this.getZoneCapacities(tenantId, eventId),
    ]);
    return [...hotels, ...parkingZones, ...venues, ...eventZones];
  }

  async updateOccupancy(
    tenantId: string,
    eventId: string,
    locationType: string,
    locationId: string,
    delta: number, // +1 for entry, -1 for exit
  ): Promise<LocationCapacity> {
    const cacheKey = `${this.CACHE_PREFIX}${tenantId}:${eventId}:${locationType}:${locationId}`;
    await this.redis.del(cacheKey);

    // Update in database based on location type
    switch (locationType) {
      case "PARKING_ZONE":
        await this.prisma.parkingZone.update({
          where: { id: locationId },
          data: { occupancy: { increment: delta } },
        });
        break;
      case "ZONE":
        await this.prisma.eventZone.update({
          where: { id: locationId },
          data: { currentOccupancy: { increment: delta } },
        });
        break;
    }

    return this.getCapacity(tenantId, eventId, locationType, locationId);
  }

  async checkCapacityAlert(
    capacity: LocationCapacity,
    thresholds: CapacityThresholds = { warningPercent: 80, criticalPercent: 95 },
  ): Promise<{ shouldAlert: boolean; level: string; message: string } | null> {
    if (capacity.utilizationPercent >= 100) {
      return {
        shouldAlert: true,
        level: "CRITICAL",
        message: `${capacity.name} is FULL (${capacity.currentOccupancy}/${capacity.totalCapacity})`,
      };
    }
    if (capacity.utilizationPercent >= thresholds.criticalPercent) {
      return {
        shouldAlert: true,
        level: "CRITICAL",
        message: `${capacity.name} at ${capacity.utilizationPercent}% capacity`,
      };
    }
    if (capacity.utilizationPercent >= thresholds.warningPercent) {
      return {
        shouldAlert: true,
        level: "WARNING",
        message: `${capacity.name} at ${capacity.utilizationPercent}% capacity`,
      };
    }
    return null;
  }

  private async calculateCapacity(
    tenantId: string,
    eventId: string,
    locationType: string,
    locationId: string,
  ): Promise<LocationCapacity> {
    // Implementation varies by location type
    // Each returns a standardized LocationCapacity object
    switch (locationType) {
      case "HOTEL":
        return this.getHotelCapacity(locationId);
      case "PARKING_ZONE":
        return this.getParkingZoneCapacity(locationId);
      case "VENUE":
        return this.getVenueCapacity(locationId);
      case "ZONE":
        return this.getEventZoneCapacity(locationId);
      default:
        throw new Error(`Unknown location type: ${locationType}`);
    }
  }

  private async getHotelCapacity(hotelId: string): Promise<LocationCapacity> {
    const hotel = await this.prisma.hotel.findUniqueOrThrow({
      where: { id: hotelId },
      include: {
        roomBlocks: {
          include: {
            assignments: { where: { status: { in: ["RESERVED", "CONFIRMED", "CHECKED_IN"] } } },
          },
        },
      },
    });

    const totalRooms = hotel.totalRooms;
    const assignedRooms = hotel.roomBlocks.reduce(
      (sum, block) => sum + block.assignments.length,
      0,
    );
    const utilization = totalRooms > 0 ? Math.round((assignedRooms / totalRooms) * 100) : 0;

    return {
      locationId: hotelId,
      locationType: "HOTEL",
      name: hotel.name,
      totalCapacity: totalRooms,
      currentOccupancy: assignedRooms,
      availableCapacity: totalRooms - assignedRooms,
      utilizationPercent: utilization,
      thresholdStatus: this.getThresholdStatus(utilization),
    };
  }

  private async getParkingZoneCapacity(zoneId: string): Promise<LocationCapacity> {
    const zone = await this.prisma.parkingZone.findUniqueOrThrow({
      where: { id: zoneId },
    });

    const utilization = zone.capacity > 0 ? Math.round((zone.occupancy / zone.capacity) * 100) : 0;

    return {
      locationId: zoneId,
      locationType: "PARKING_ZONE",
      name: zone.name,
      totalCapacity: zone.capacity,
      currentOccupancy: zone.occupancy,
      availableCapacity: zone.capacity - zone.occupancy,
      utilizationPercent: utilization,
      thresholdStatus: this.getThresholdStatus(utilization),
    };
  }

  private async getVenueCapacity(venueId: string): Promise<LocationCapacity> {
    const rooms = await this.prisma.room.findMany({
      where: { venueId },
    });

    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

    return {
      locationId: venueId,
      locationType: "VENUE",
      name: `Venue ${venueId}`,
      totalCapacity,
      currentOccupancy: 0, // calculated from active bookings
      availableCapacity: totalCapacity,
      utilizationPercent: 0,
      thresholdStatus: "NORMAL",
    };
  }

  private async getEventZoneCapacity(zoneId: string): Promise<LocationCapacity> {
    const zone = await this.prisma.eventZone.findUniqueOrThrow({
      where: { id: zoneId },
    });

    const capacity = zone.capacity ?? 0;
    const utilization = capacity > 0 ? Math.round((zone.currentOccupancy / capacity) * 100) : 0;

    return {
      locationId: zoneId,
      locationType: "ZONE",
      name: zone.name,
      totalCapacity: capacity,
      currentOccupancy: zone.currentOccupancy,
      availableCapacity: capacity - zone.currentOccupancy,
      utilizationPercent: utilization,
      thresholdStatus: this.getThresholdStatus(utilization),
    };
  }

  private getThresholdStatus(utilization: number): "NORMAL" | "WARNING" | "CRITICAL" | "FULL" {
    if (utilization >= 100) return "FULL";
    if (utilization >= 95) return "CRITICAL";
    if (utilization >= 80) return "WARNING";
    return "NORMAL";
  }

  private async getHotelCapacities(tenantId: string, eventId: string): Promise<LocationCapacity[]> {
    const hotels = await this.prisma.hotel.findMany({
      where: { tenantId, eventId },
    });
    return Promise.all(hotels.map((h) => this.getHotelCapacity(h.id)));
  }

  private async getParkingCapacities(
    tenantId: string,
    eventId: string,
  ): Promise<LocationCapacity[]> {
    const zones = await this.prisma.parkingZone.findMany({
      where: { tenantId, eventId },
    });
    return Promise.all(zones.map((z) => this.getParkingZoneCapacity(z.id)));
  }

  private async getVenueCapacities(tenantId: string, eventId: string): Promise<LocationCapacity[]> {
    // Retrieve venue IDs associated with the event
    const rooms = await this.prisma.room.findMany({
      where: { venue: { tenantId } },
      select: { venueId: true },
      distinct: ["venueId"],
    });
    return Promise.all(rooms.map((r) => this.getVenueCapacity(r.venueId)));
  }

  private async getZoneCapacities(tenantId: string, eventId: string): Promise<LocationCapacity[]> {
    const zones = await this.prisma.eventZone.findMany({
      where: { tenantId, eventId },
    });
    return Promise.all(zones.map((z) => this.getEventZoneCapacity(z.id)));
  }
}
```

### 2.3 Real-Time Vehicle Tracking Subsystem

```typescript
// src/logistics/transport/vehicle-tracking.service.ts

import { Injectable } from "@nestjs/common";
import { RedisService } from "@/redis/redis.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

interface VehiclePosition {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading: number; // degrees
  timestamp: Date;
  tripId?: string;
  status: string;
}

interface GeoFenceAlert {
  vehicleId: string;
  fenceId: string;
  fenceName: string;
  event: "ENTER" | "EXIT";
  timestamp: Date;
}

@Injectable()
export class VehicleTrackingService {
  private readonly POSITION_PREFIX = "vehicle:position:";
  private readonly POSITION_TTL = 300; // 5 minutes
  private readonly TRACKING_INTERVAL = 15; // seconds

  constructor(
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async updatePosition(position: VehiclePosition): Promise<void> {
    const key = `${this.POSITION_PREFIX}${position.vehicleId}`;

    // Store latest position in Redis
    await this.redis.setex(key, this.POSITION_TTL, JSON.stringify(position));

    // Store in Redis geo index for proximity queries
    await this.redis.geoadd(
      "vehicle:geo",
      position.longitude,
      position.latitude,
      position.vehicleId,
    );

    // Publish position update via SSE channel
    this.eventEmitter.emit("vehicle.position.updated", position);

    // Check geofences
    await this.checkGeoFences(position);
  }

  async getPosition(vehicleId: string): Promise<VehiclePosition | null> {
    const key = `${this.POSITION_PREFIX}${vehicleId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async getAllPositions(eventId: string): Promise<VehiclePosition[]> {
    // Retrieve all vehicle positions for the event
    const pattern = `${this.POSITION_PREFIX}*`;
    const keys = await this.redis.keys(pattern);
    const positions: VehiclePosition[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        positions.push(JSON.parse(data));
      }
    }
    return positions;
  }

  async getNearbyVehicles(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<{ vehicleId: string; distance: number }[]> {
    const results = await this.redis.georadius(
      "vehicle:geo",
      longitude,
      latitude,
      radiusKm,
      "km",
      "WITHDIST",
      "ASC",
    );

    return results.map((r: any) => ({
      vehicleId: r[0],
      distance: parseFloat(r[1]),
    }));
  }

  async getEstimatedArrival(
    vehicleId: string,
    destinationLat: number,
    destinationLng: number,
  ): Promise<{ distanceKm: number; estimatedMinutes: number } | null> {
    const position = await this.getPosition(vehicleId);
    if (!position) return null;

    const distanceKm = this.haversineDistance(
      position.latitude,
      position.longitude,
      destinationLat,
      destinationLng,
    );

    // Average speed in city: 30 km/h, use actual speed if available
    const avgSpeed = position.speed > 5 ? position.speed : 30;
    const estimatedMinutes = Math.round((distanceKm / avgSpeed) * 60);

    return { distanceKm: Math.round(distanceKm * 10) / 10, estimatedMinutes };
  }

  private async checkGeoFences(position: VehiclePosition): Promise<void> {
    // Check if vehicle entered/exited predefined geofences (airports, venues, hotels)
    const fences = await this.getGeoFences();

    for (const fence of fences) {
      const distance = this.haversineDistance(
        position.latitude,
        position.longitude,
        fence.latitude,
        fence.longitude,
      );
      const isInside = distance <= fence.radiusKm;
      const wasInside = await this.redis.get(`geofence:${position.vehicleId}:${fence.id}`);

      if (isInside && !wasInside) {
        await this.redis.setex(`geofence:${position.vehicleId}:${fence.id}`, 3600, "1");
        this.eventEmitter.emit("vehicle.geofence", {
          vehicleId: position.vehicleId,
          fenceId: fence.id,
          fenceName: fence.name,
          event: "ENTER",
          timestamp: new Date(),
        } as GeoFenceAlert);
      } else if (!isInside && wasInside) {
        await this.redis.del(`geofence:${position.vehicleId}:${fence.id}`);
        this.eventEmitter.emit("vehicle.geofence", {
          vehicleId: position.vehicleId,
          fenceId: fence.id,
          fenceName: fence.name,
          event: "EXIT",
          timestamp: new Date(),
        } as GeoFenceAlert);
      }
    }
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async getGeoFences(): Promise<
    Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      radiusKm: number;
    }>
  > {
    // Load from cache or database
    const cached = await this.redis.get("geofences:all");
    if (cached) return JSON.parse(cached);
    return [];
  }
}
```

### 2.4 Capacity Planning Engine

```typescript
// src/logistics/shared/capacity-planning.engine.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

interface DemandForecast {
  domain: string;
  date: Date;
  metric: string;
  forecastValue: number;
  confidenceInterval: { low: number; high: number };
  basedOn: string; // description of data source
}

interface ResourceAllocation {
  domain: string;
  resource: string;
  allocated: number;
  required: number;
  surplus: number;
  status: "ADEQUATE" | "TIGHT" | "DEFICIT";
}

@Injectable()
export class CapacityPlanningEngine {
  constructor(private readonly prisma: PrismaService) {}

  async generateForecast(
    tenantId: string,
    eventId: string,
    targetDate: Date,
  ): Promise<DemandForecast[]> {
    const forecasts: DemandForecast[] = [];

    // Accommodation demand
    const accommodationForecast = await this.forecastAccommodation(tenantId, eventId, targetDate);
    forecasts.push(...accommodationForecast);

    // Transport demand
    const transportForecast = await this.forecastTransport(tenantId, eventId, targetDate);
    forecasts.push(...transportForecast);

    // Catering demand
    const cateringForecast = await this.forecastCatering(tenantId, eventId, targetDate);
    forecasts.push(...cateringForecast);

    // Parking demand
    const parkingForecast = await this.forecastParking(tenantId, eventId, targetDate);
    forecasts.push(...parkingForecast);

    return forecasts;
  }

  async optimizeResourceAllocation(
    tenantId: string,
    eventId: string,
  ): Promise<ResourceAllocation[]> {
    const allocations: ResourceAllocation[] = [];

    // Check hotel room allocation vs. approved participants
    const roomAllocation = await this.checkRoomAllocation(tenantId, eventId);
    allocations.push(roomAllocation);

    // Check vehicle fleet vs. transport requests
    const vehicleAllocation = await this.checkVehicleAllocation(tenantId, eventId);
    allocations.push(vehicleAllocation);

    // Check catering capacity vs. expected diners
    const cateringAllocation = await this.checkCateringAllocation(tenantId, eventId);
    allocations.push(cateringAllocation);

    // Check parking capacity vs. expected vehicles
    const parkingAllocation = await this.checkParkingAllocation(tenantId, eventId);
    allocations.push(parkingAllocation);

    return allocations;
  }

  private async forecastAccommodation(
    tenantId: string,
    eventId: string,
    targetDate: Date,
  ): Promise<DemandForecast[]> {
    const approvedCount = await this.prisma.roomAssignment.count({
      where: {
        roomBlock: { hotel: { tenantId, eventId } },
        checkInDate: { lte: targetDate },
        checkOutDate: { gte: targetDate },
        status: { in: ["RESERVED", "CONFIRMED", "CHECKED_IN"] },
      },
    });

    return [
      {
        domain: "ACCOMMODATION",
        date: targetDate,
        metric: "rooms_needed",
        forecastValue: Math.ceil(approvedCount * 1.05), // 5% buffer for late registrations
        confidenceInterval: { low: approvedCount, high: Math.ceil(approvedCount * 1.1) },
        basedOn: "Approved participant room assignments + 5% buffer",
      },
    ];
  }

  private async forecastTransport(
    tenantId: string,
    eventId: string,
    targetDate: Date,
  ): Promise<DemandForecast[]> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const requestCount = await this.prisma.transportRequest.count({
      where: {
        tenantId,
        eventId,
        scheduledTime: { gte: startOfDay, lte: endOfDay },
        status: { not: "CANCELLED" },
      },
    });

    return [
      {
        domain: "TRANSPORT",
        date: targetDate,
        metric: "transport_requests",
        forecastValue: requestCount,
        confidenceInterval: { low: requestCount, high: Math.ceil(requestCount * 1.15) },
        basedOn: "Scheduled transport requests for date",
      },
    ];
  }

  private async forecastCatering(
    tenantId: string,
    eventId: string,
    targetDate: Date,
  ): Promise<DemandForecast[]> {
    const mealPlans = await this.prisma.mealPlan.findMany({
      where: { tenantId, eventId, date: targetDate },
      include: { services: true },
    });

    return mealPlans.flatMap((plan) =>
      plan.services.map((service) => ({
        domain: "CATERING",
        date: targetDate,
        metric: `${service.mealType}_covers`,
        forecastValue: service.capacity ?? 0,
        confidenceInterval: {
          low: Math.floor((service.capacity ?? 0) * 0.85),
          high: service.capacity ?? 0,
        },
        basedOn: `Meal plan capacity for ${service.mealType}`,
      })),
    );
  }

  private async forecastParking(
    tenantId: string,
    eventId: string,
    targetDate: Date,
  ): Promise<DemandForecast[]> {
    const activePermits = await this.prisma.parkingPermit.count({
      where: {
        parkingZone: { tenantId, eventId },
        validFrom: { lte: targetDate },
        validTo: { gte: targetDate },
        status: "ACTIVE",
      },
    });

    return [
      {
        domain: "PARKING",
        date: targetDate,
        metric: "parking_permits_active",
        forecastValue: activePermits,
        confidenceInterval: { low: activePermits, high: Math.ceil(activePermits * 1.1) },
        basedOn: "Active parking permits valid for date",
      },
    ];
  }

  private async checkRoomAllocation(
    tenantId: string,
    eventId: string,
  ): Promise<ResourceAllocation> {
    const totalRooms = await this.prisma.hotel.aggregate({
      where: { tenantId, eventId },
      _sum: { totalRooms: true },
    });
    const totalAssignments = await this.prisma.roomAssignment.count({
      where: {
        roomBlock: { hotel: { tenantId, eventId } },
        status: { in: ["RESERVED", "CONFIRMED", "CHECKED_IN"] },
      },
    });

    const allocated = totalRooms._sum.totalRooms ?? 0;
    const surplus = allocated - totalAssignments;

    return {
      domain: "ACCOMMODATION",
      resource: "hotel_rooms",
      allocated,
      required: totalAssignments,
      surplus,
      status: surplus > allocated * 0.1 ? "ADEQUATE" : surplus > 0 ? "TIGHT" : "DEFICIT",
    };
  }

  private async checkVehicleAllocation(
    tenantId: string,
    eventId: string,
  ): Promise<ResourceAllocation> {
    const totalVehicles = await this.prisma.vehicle.count({
      where: { tenantId, eventId, status: { not: "MAINTENANCE" } },
    });
    const pendingRequests = await this.prisma.transportRequest.count({
      where: { tenantId, eventId, status: "PENDING" },
    });

    const surplus = totalVehicles - pendingRequests;
    return {
      domain: "TRANSPORT",
      resource: "vehicles",
      allocated: totalVehicles,
      required: pendingRequests,
      surplus,
      status: surplus > totalVehicles * 0.2 ? "ADEQUATE" : surplus > 0 ? "TIGHT" : "DEFICIT",
    };
  }

  private async checkCateringAllocation(
    tenantId: string,
    eventId: string,
  ): Promise<ResourceAllocation> {
    const totalCapacity = await this.prisma.mealService.aggregate({
      where: { mealPlan: { tenantId, eventId } },
      _sum: { capacity: true },
    });

    const allocated = totalCapacity._sum.capacity ?? 0;
    return {
      domain: "CATERING",
      resource: "meal_covers",
      allocated,
      required: 0, // calculated from approved participant count
      surplus: allocated,
      status: "ADEQUATE",
    };
  }

  private async checkParkingAllocation(
    tenantId: string,
    eventId: string,
  ): Promise<ResourceAllocation> {
    const totalCapacity = await this.prisma.parkingZone.aggregate({
      where: { tenantId, eventId },
      _sum: { capacity: true },
    });
    const activePermits = await this.prisma.parkingPermit.count({
      where: { parkingZone: { tenantId, eventId }, status: "ACTIVE" },
    });

    const allocated = totalCapacity._sum.capacity ?? 0;
    const surplus = allocated - activePermits;
    return {
      domain: "PARKING",
      resource: "parking_spaces",
      allocated,
      required: activePermits,
      surplus,
      status: surplus > allocated * 0.15 ? "ADEQUATE" : surplus > 0 ? "TIGHT" : "DEFICIT",
    };
  }
}
```

### 2.5 Venue Rendering Engine

```typescript
// src/logistics/venue/venue-rendering.engine.ts

import { Injectable } from "@nestjs/common";

interface FloorPlanElement {
  id: string;
  type: "ROOM" | "BOOTH" | "TABLE" | "ZONE" | "ANNOTATION" | "EQUIPMENT";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  polygon?: [number, number][]; // for irregular shapes
  color?: string;
  metadata?: Record<string, any>;
}

interface FloorPlanRenderData {
  floorPlanId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  elements: FloorPlanElement[];
  zones: Array<{
    id: string;
    name: string;
    type: string;
    polygon: [number, number][];
    color: string;
  }>;
  scale: number; // pixels per meter
}

@Injectable()
export class VenueRenderingEngine {
  /**
   * Generates renderable floor plan data for the client-side editor.
   * The client receives the base image URL and an overlay of interactive elements.
   */
  async getRenderData(floorPlanId: string): Promise<FloorPlanRenderData> {
    // Load floor plan with rooms and zones
    // Returns structured data for client-side canvas rendering
    return {} as FloorPlanRenderData; // placeholder
  }

  /**
   * Validates element placement: no overlaps, within image bounds,
   * capacity annotations consistent with room model.
   */
  validatePlacement(
    elements: FloorPlanElement[],
    imageWidth: number,
    imageHeight: number,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const element of elements) {
      // Bounds check
      if (
        element.x < 0 ||
        element.y < 0 ||
        element.x + element.width > imageWidth ||
        element.y + element.height > imageHeight
      ) {
        errors.push(`Element "${element.name}" is out of bounds`);
      }

      // Overlap check against other elements
      for (const other of elements) {
        if (element.id === other.id) continue;
        if (this.rectanglesOverlap(element, other)) {
          errors.push(`Element "${element.name}" overlaps with "${other.name}"`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calculates walking distance between two points on a floor plan
   * using simple Euclidean distance scaled by the floor plan's scale factor.
   */
  calculateDistance(
    from: { x: number; y: number },
    to: { x: number; y: number },
    scalePixelsPerMeter: number,
  ): { distanceMeters: number; estimatedWalkMinutes: number } {
    const pixelDistance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    const meters = pixelDistance / scalePixelsPerMeter;
    // Average walking speed: 1.4 m/s
    const minutes = meters / (1.4 * 60);

    return {
      distanceMeters: Math.round(meters),
      estimatedWalkMinutes: Math.round(minutes * 10) / 10,
    };
  }

  private rectanglesOverlap(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
  ): boolean {
    return !(
      a.x + a.width <= b.x ||
      b.x + b.width <= a.x ||
      a.y + a.height <= b.y ||
      b.y + b.height <= a.y
    );
  }
}
```

---

## 3. Data Model

### 3.1 Accommodation Models

```prisma
enum RoomAssignmentStatus {
  RESERVED
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  NO_SHOW
}

model Hotel {
  id           String   @id @default(cuid())
  tenantId     String
  eventId      String
  name         String
  address      String
  starRating   Int?
  totalRooms   Int
  contactName  String?
  contactPhone String?
  distanceToVenue String?  // "2.5 km / 10 min drive"
  amenities    String[]   // ["WiFi", "Pool", "Restaurant", "Shuttle"]
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  roomBlocks   RoomBlock[]

  @@unique([tenantId, eventId, name])
}

model RoomBlock {
  id                String          @id @default(cuid())
  hotelId           String
  hotel             Hotel           @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  participantTypeId String?         // Allocated for specific participant type
  roomType          String          // "Single", "Double", "Suite", "Presidential"
  quantity          Int
  pricePerNight     Float?
  checkInDate       DateTime
  checkOutDate      DateTime
  contactEmail      String?         // Hotel coordinator for this block
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  assignments       RoomAssignment[]

  @@index([hotelId])
}

model RoomAssignment {
  id            String               @id @default(cuid())
  roomBlockId   String
  roomBlock     RoomBlock            @relation(fields: [roomBlockId], references: [id], onDelete: Cascade)
  participantId String
  roomNumber    String?
  checkInDate   DateTime
  checkOutDate  DateTime
  status        RoomAssignmentStatus
  specialRequests String?            // "Connecting room with delegation", "Ground floor"
  notes         String?
  assignedBy    String?              // userId or "SYSTEM" for auto-assignment
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  @@unique([roomBlockId, participantId])
  @@index([participantId])
  @@index([status])
}
```

### 3.2 Transportation Models

```prisma
enum TransportType {
  AIRPORT_PICKUP
  AIRPORT_DROPOFF
  HOTEL_TO_VENUE
  VENUE_TO_HOTEL
  INTER_VENUE
  MOTORCADE
  AD_HOC
}

enum TransportStatus {
  PENDING
  CONFIRMED
  DRIVER_ASSIGNED
  EN_ROUTE_PICKUP
  PASSENGER_COLLECTED
  EN_ROUTE_DESTINATION
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum VehicleType {
  SEDAN
  SUV
  VAN
  MINIBUS
  BUS
  MOTORCYCLE_ESCORT
}

enum VehicleStatus {
  AVAILABLE
  ASSIGNED
  IN_USE
  MAINTENANCE
  OFF_DUTY
}

model TransportRequest {
  id              String          @id @default(cuid())
  tenantId        String
  eventId         String
  participantId   String
  type            TransportType
  status          TransportStatus

  pickupLocation  String
  dropoffLocation String
  scheduledTime   DateTime
  flightNumber    String?
  flightArrivalTime DateTime?
  terminalGate    String?
  vehicleId       String?
  vehicle         Vehicle?        @relation(fields: [vehicleId], references: [id])
  driverId        String?
  passengerCount  Int             @default(1)

  actualPickupTime  DateTime?
  actualDropoffTime DateTime?
  notes             String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([eventId, scheduledTime])
  @@index([eventId, status])
  @@index([driverId, scheduledTime])
  @@index([vehicleId, scheduledTime])
}

model Vehicle {
  id            String        @id @default(cuid())
  tenantId      String
  eventId       String
  plateNumber   String
  type          VehicleType
  capacity      Int
  assignedTo    String?       // Delegation or participant type
  status        VehicleStatus
  driverName    String?
  driverPhone   String?
  gpsTrackingId String?

  requests      TransportRequest[]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@unique([tenantId, eventId, plateNumber])
  @@index([eventId, status])
}

model ShuttleRoute {
  id            String   @id @default(cuid())
  tenantId      String
  eventId       String
  name          String   // "Hotel Zone -> Venue", "Airport Express"
  stops         Json     // [{ name, location, arrivalOffset }]
  vehicleIds    String[] // Assigned vehicles
  frequency     Int      // Minutes between departures
  startTime     String   // "06:00"
  endTime       String   // "22:00"
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([tenantId, eventId, name])
}
```

### 3.3 Catering & Meal Models

```prisma
enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  COFFEE_BREAK
  RECEPTION
}

enum DietaryType {
  STANDARD
  VEGETARIAN
  VEGAN
  HALAL
  KOSHER
  GLUTEN_FREE
  DAIRY_FREE
  NUT_FREE
}

enum VoucherStatus {
  ISSUED
  COLLECTED
  EXPIRED
  CANCELLED
}

model MealPlan {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String   // "Day 1 Full Board", "Day 2 Lunch Only"
  date        DateTime @db.Date
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  services    MealService[]

  @@unique([eventId, date, name])
  @@index([eventId])
}

model MealService {
  id          String   @id @default(cuid())
  mealPlanId  String
  mealPlan    MealPlan @relation(fields: [mealPlanId], references: [id], onDelete: Cascade)
  mealType    MealType
  venue       String   // "Restaurant Level 2", "VIP Lounge", "Exhibition Hall"
  startTime   DateTime
  endTime     DateTime
  capacity    Int?     // Maximum covers for this service
  menuNotes   String?  // "3-course plated", "Buffet style"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  vouchers    MealVoucher[]
  checkIns    MealCheckIn[]

  @@index([mealPlanId, mealType])
}

model MealVoucher {
  id              String        @id @default(cuid())
  mealServiceId   String
  mealService     MealService   @relation(fields: [mealServiceId], references: [id], onDelete: Cascade)
  participantId   String
  participant     Participant   @relation(fields: [participantId], references: [id], onDelete: Cascade)
  dietaryType     DietaryType   @default(STANDARD)
  qrCode          String        @unique // Encrypted: voucherId + participantId + mealServiceId
  status          VoucherStatus @default(ISSUED)
  issuedAt        DateTime      @default(now())
  collectedAt     DateTime?
  collectedBy     String?       // Staff member who scanned
  cancelledReason String?

  @@unique([mealServiceId, participantId])
  @@index([participantId, status])
  @@index([qrCode])
}

model MealCheckIn {
  id              String      @id @default(cuid())
  mealServiceId   String
  mealService     MealService @relation(fields: [mealServiceId], references: [id], onDelete: Cascade)
  participantId   String
  participant     Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  dietaryType     DietaryType
  scannedAt       DateTime    @default(now())
  scannedBy       String      // userId of the scanning staff
  stationId       String?     // Which scanning station/entrance

  @@unique([mealServiceId, participantId])
  @@index([mealServiceId, scannedAt])
}
```

### 3.4 Parking & Zone Access Models

```prisma
model ParkingZone {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String   // "VIP Parking", "Delegate Lot B", "Media Compound"
  code        String   // Short code: "P1", "P2", "PVIP"
  capacity    Int
  occupancy   Int      @default(0) // Real-time count from gate scans
  latitude    Float?
  longitude   Float?
  color       String?  // Zone color for car pass and signage: "#FFD700" for VIP gold
  accessRules Json     @default("[]")
  // [{"participantTypes": ["Minister","Head of State"], "accessLevel": "CLOSED"}]
  // [{"staffRoles": ["DRIVER","SECURITY_GUARD"]}]
  operatingHours Json  @default("{}")
  // {"open": "06:00", "close": "22:00"}
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  permits     ParkingPermit[]
  gateLogs    ParkingGateLog[]

  @@unique([tenantId, eventId, code])
}

model ParkingPermit {
  id            String      @id @default(cuid())
  parkingZoneId String
  parkingZone   ParkingZone @relation(fields: [parkingZoneId], references: [id], onDelete: Cascade)
  participantId String?     // null for general-use permits
  vehiclePlate  String
  vehicleType   String?     // SEDAN, SUV, VAN, BUS, MOTORCYCLE
  vehicleColor  String?
  driverName    String?
  permitNumber  String      @unique
  qrPayload     String      // Encrypted payload for gate scanning
  validFrom     DateTime
  validTo       DateTime
  status        ParkingPermitStatus @default(ACTIVE)
  issuedAt      DateTime    @default(now())

  @@index([vehiclePlate])
  @@index([parkingZoneId, status])
  @@index([participantId])
}

enum ParkingPermitStatus {
  ACTIVE
  EXPIRED
  REVOKED
  SUSPENDED
}

model ParkingGateLog {
  id            String      @id @default(cuid())
  parkingZoneId String
  parkingZone   ParkingZone @relation(fields: [parkingZoneId], references: [id], onDelete: Cascade)
  permitId      String?
  vehiclePlate  String
  direction     String      // ENTRY, EXIT
  result        String      // ALLOWED, DENIED_FULL, DENIED_ACCESS, DENIED_EXPIRED, DENIED_INVALID
  scannedBy     String?     // userId or "AUTO" for automated gates
  scannedAt     DateTime    @default(now())

  @@index([parkingZoneId, scannedAt])
  @@index([vehiclePlate])
}
```

### 3.5 Venue & Floor Plan Models

```prisma
model VenueFloorPlan {
  id          String   @id @default(cuid())
  venueId     String
  venue       Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  name        String   // "Ground Floor", "Conference Level 2", "Exhibition Hall"
  floorNumber Int?
  imageUrl    String   // Uploaded floor plan image (Azure Blob)
  width       Float?   // Image dimensions for coordinate mapping
  height      Float?
  zones       Json     @default("[]")
  // [{"id":"z1","name":"Registration","type":"FUNCTIONAL","polygon":[[x,y]...],"color":"#3B82F6"}]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  rooms       Room[]

  @@unique([venueId, name])
}

model Room {
  id           String         @id @default(cuid())
  venueId      String
  venue        Venue          @relation(fields: [venueId], references: [id], onDelete: Cascade)
  floorPlanId  String?
  floorPlan    VenueFloorPlan? @relation(fields: [floorPlanId], references: [id])
  name         String         // "Plenary Hall", "Bilateral Room 3", "Press Center"
  code         String?        // Short code: "PH", "BR3", "PC"
  capacity     Int
  setupType    RoomSetupType  @default(THEATER)
  equipment    Json           @default("[]")
  // ["projector","screen_16x9","wireless_mic_x4","interpretation_booth_x6","video_conference"]
  amenities    Json           @default("[]")
  // ["wifi","power_outlets","water_station","coat_room","disabled_access"]
  isBookable   Boolean        @default(true)
  hourlyRate   Float?
  positionX    Float?         // Position on floor plan image
  positionY    Float?
  notes        String?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  bookings     RoomBooking[]

  @@unique([venueId, name])
  @@index([venueId, isBookable])
}

enum RoomSetupType {
  THEATER       // Rows of chairs facing front
  BOARDROOM     // Large table with chairs around
  CLASSROOM     // Tables and chairs in rows
  BANQUET       // Round tables for dining
  U_SHAPE       // U-shaped table arrangement
  HOLLOW_SQUARE // Square with open center (typical for AU sessions)
  EXHIBITION    // Open floor with booth spaces
  RECEPTION     // Standing/cocktail layout
  CUSTOM        // Non-standard
}

model RoomBooking {
  id          String   @id @default(cuid())
  roomId      String
  room        Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  meetingId   String?  // If linked to a Meeting record
  title       String
  bookedBy    String   // userId
  startTime   DateTime
  endTime     DateTime
  setupTime   Int      @default(30) // Minutes before for room setup
  teardownTime Int     @default(15) // Minutes after for cleanup
  setupType   RoomSetupType? // Override room default
  setupNotes  String?  // "4 country flags on stage", "U-shape with 20 seats", "No water on tables"
  attendees   Int?     // Expected count
  status      RoomBookingStatus @default(TENTATIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([roomId, startTime, endTime])
  @@index([eventId, startTime])
  @@index([status])
}

enum RoomBookingStatus {
  TENTATIVE
  CONFIRMED
  SETUP_IN_PROGRESS
  READY
  IN_USE
  TEARDOWN
  CANCELLED
}
```

### 3.6 Multi-Venue Zone Models

```prisma
model EventZone {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String   // "Registration Zone", "Conference Zone", "VIP Zone"
  code        String   // "REG", "CONF", "VIP"
  type        ZoneType
  venueId     String?  // Which venue this zone is in
  venue       Venue?   @relation(fields: [venueId], references: [id])
  color       String?  // For maps and badges: "#3B82F6"
  capacity    Int?
  currentOccupancy Int @default(0) // Real-time from access control scans

  // Access rules: which badge types / participant types can enter
  accessRules Json     @default("[]")
  // [{"participantTypes": ["Minister","Head of State"]}, {"staffRoles": ["PROTOCOL_OFFICER"]}]

  // Operating hours
  operatingHours Json  @default("{}")
  // {"mon": {"open":"06:00","close":"22:00"}, "tue": {...}}

  // Zone manager
  managerId   String?  // userId responsible for this zone

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  accessLogs  ZoneAccessLog[]

  @@unique([tenantId, eventId, code])
  @@index([eventId])
}

enum ZoneType {
  REGISTRATION    // Badge pickup, document check
  CONFERENCE      // Meeting rooms, plenary halls
  EXHIBITION      // Booths, displays
  VIP             // Restricted VIP lounges
  PRESS           // Media center, press room
  CATERING        // Restaurants, coffee stations
  SERVICE         // Staff areas, storage, ops room
  PARKING         // Linked to ParkingZone
  MEDICAL         // First aid, medical station
  SECURITY        // Screening checkpoints
  SOCIAL          // Networking areas, reception venues
}

model ZoneAccessLog {
  id          String    @id @default(cuid())
  zoneId      String
  zone        EventZone @relation(fields: [zoneId], references: [id], onDelete: Cascade)
  participantId String?
  staffId     String?
  direction   String    // ENTRY, EXIT
  result      String    // ALLOWED, DENIED_ACCESS, DENIED_CAPACITY, DENIED_HOURS
  scannedAt   DateTime  @default(now())

  @@index([zoneId, scannedAt])
  @@index([participantId, scannedAt])
}

model InterZoneShuttle {
  id          String   @id @default(cuid())
  tenantId    String
  eventId     String
  name        String   // "Conference Centre <-> Hotel Sheraton"
  fromZoneId  String
  toZoneId    String
  departureTime DateTime
  estimatedDuration Int // Minutes
  capacity    Int
  vehicleId   String?  // Linked to Vehicle record
  driverId    String?  // Linked to StaffMember
  status      String   // SCHEDULED, BOARDING, IN_TRANSIT, ARRIVED, CANCELLED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([eventId, departureTime])
  @@index([fromZoneId])
}
```

### 3.7 Vendor Management Model

```prisma
enum VendorCategory {
  CATERING
  TRANSPORT
  ACCOMMODATION
  SECURITY
  AV_EQUIPMENT
  CLEANING
  SIGNAGE
  PRINTING
  OTHER
}

enum VendorStatus {
  PROSPECTIVE
  CONTRACTED
  ACTIVE
  SUSPENDED
  TERMINATED
}

enum ContractStatus {
  DRAFT
  PENDING_APPROVAL
  ACTIVE
  COMPLETED
  TERMINATED
}

model Vendor {
  id              String         @id @default(cuid())
  tenantId        String
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name            String
  category        VendorCategory
  status          VendorStatus   @default(PROSPECTIVE)
  contactName     String
  contactEmail    String
  contactPhone    String?
  address         String?
  taxId           String?        // Tax identification number
  bankDetails     Json?          // Encrypted bank account details
  rating          Float?         // 1-5 average performance rating
  notes           String?
  portalAccessUrl String?        // Unique time-limited URL for vendor portal
  portalExpiresAt DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  contracts       VendorContract[]
  invoices        VendorInvoice[]
  performanceLogs VendorPerformanceLog[]

  @@unique([tenantId, name])
  @@index([tenantId, category])
  @@index([tenantId, status])
}

model VendorContract {
  id              String         @id @default(cuid())
  vendorId        String
  vendor          Vendor         @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  eventId         String
  event           Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  contractNumber  String         @unique
  title           String
  description     String?
  status          ContractStatus @default(DRAFT)
  startDate       DateTime
  endDate         DateTime
  totalValue      Float
  currency        String         @default("USD")
  slaTerms        Json?          // SLA conditions and penalties
  deliverables    Json?          // Expected deliverables with deadlines
  signedDocUrl    String?        // Uploaded signed contract document
  approvedBy      String?        // userId
  approvedAt      DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  invoices        VendorInvoice[]

  @@index([vendorId])
  @@index([eventId])
}

model VendorInvoice {
  id              String       @id @default(cuid())
  vendorId        String
  vendor          Vendor       @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  contractId      String?
  contract        VendorContract? @relation(fields: [contractId], references: [id])
  invoiceNumber   String       @unique
  description     String
  amount          Float
  currency        String       @default("USD")
  issueDate       DateTime
  dueDate         DateTime
  paidDate        DateTime?
  status          String       @default("PENDING") // PENDING, APPROVED, PAID, DISPUTED, CANCELLED
  documentUrl     String?      // Uploaded invoice document
  approvedBy      String?
  notes           String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([vendorId, status])
  @@index([contractId])
}

model VendorPerformanceLog {
  id          String   @id @default(cuid())
  vendorId    String
  vendor      Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  eventId     String
  metric      String   // "delivery_timeliness", "quality_score", "responsiveness"
  score       Float    // 1-5 rating
  notes       String?
  recordedBy  String   // userId
  recordedAt  DateTime @default(now())

  @@index([vendorId, eventId])
}
```

### 3.8 Capacity Plan Model

```prisma
enum CapacityPlanStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

model CapacityPlan {
  id          String             @id @default(cuid())
  tenantId    String
  tenant      Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  eventId     String
  event       Event              @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String             // "Master Logistics Plan", "Day 1 Capacity Plan"
  status      CapacityPlanStatus @default(DRAFT)
  targetDate  DateTime?          // Specific date, or null for overall plan
  forecasts   Json               // Array of DemandForecast objects
  allocations Json               // Array of ResourceAllocation objects
  assumptions Json?              // Planning assumptions and notes
  createdBy   String
  approvedBy  String?
  approvedAt  DateTime?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@unique([tenantId, eventId, name])
  @@index([eventId, status])
}
```

### 3.9 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOGISTICS & VENUE - ENTITY RELATIONSHIPS                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ACCOMMODATION                                                               │
│  ┌──────────┐ 1──* ┌──────────┐ 1──* ┌──────────────┐                      │
│  │  Hotel    │─────>│RoomBlock │─────>│RoomAssignment │                      │
│  └──────────┘      └──────────┘      └──────┬───────┘                       │
│       │                  │                   │                                │
│       │ tenantId+eventId │ participantTypeId │ participantId                 │
│       │                  │                   │                                │
│  TRANSPORTATION                              │                                │
│  ┌──────────┐ 1──* ┌─────────────────┐      │                                │
│  │ Vehicle  │─────>│TransportRequest  │<─────┘ (participantId)               │
│  └──────────┘      └─────────────────┘                                       │
│                                                                              │
│  ┌──────────────┐                                                            │
│  │ ShuttleRoute │  (standalone, references vehicleIds[])                     │
│  └──────────────┘                                                            │
│                                                                              │
│  CATERING                                                                    │
│  ┌──────────┐ 1──* ┌─────────────┐ 1──* ┌─────────────┐                    │
│  │ MealPlan │─────>│ MealService │─────>│ MealVoucher  │                    │
│  └──────────┘      └──────┬──────┘      └──────────────┘                    │
│                           │ 1──*                                             │
│                    ┌──────┴──────┐                                           │
│                    │ MealCheckIn │                                            │
│                    └─────────────┘                                           │
│                                                                              │
│  PARKING                                                                     │
│  ┌─────────────┐ 1──* ┌───────────────┐                                    │
│  │ ParkingZone │─────>│ ParkingPermit │                                     │
│  └──────┬──────┘      └───────────────┘                                    │
│         │ 1──*                                                               │
│  ┌──────┴────────┐                                                          │
│  │ParkingGateLog │                                                           │
│  └───────────────┘                                                          │
│                                                                              │
│  VENUE & FLOOR PLANS                                                         │
│  ┌───────┐ 1──* ┌────────────────┐ 1──* ┌──────┐ 1──* ┌─────────────┐     │
│  │ Venue │─────>│ VenueFloorPlan │─────>│ Room │─────>│ RoomBooking │      │
│  └───────┘      └────────────────┘      └──────┘      └─────────────┘      │
│                                                                              │
│  MULTI-VENUE ZONES                                                           │
│  ┌───────────┐ 1──* ┌───────────────┐                                      │
│  │ EventZone │─────>│ ZoneAccessLog │                                       │
│  └───────────┘      └───────────────┘                                      │
│                                                                              │
│  ┌──────────────────┐                                                       │
│  │ InterZoneShuttle │ (references fromZoneId, toZoneId)                     │
│  └──────────────────┘                                                       │
│                                                                              │
│  VENDOR MANAGEMENT                                                           │
│  ┌────────┐ 1──* ┌────────────────┐ 1──* ┌───────────────┐                 │
│  │ Vendor │─────>│VendorContract  │─────>│ VendorInvoice │                  │
│  └──┬─────┘      └────────────────┘      └───────────────┘                 │
│     │ 1──*                                                                   │
│  ┌──┴────────────────────┐                                                  │
│  │ VendorPerformanceLog  │                                                   │
│  └───────────────────────┘                                                  │
│                                                                              │
│  CAPACITY PLANNING                                                           │
│  ┌──────────────┐                                                           │
│  │ CapacityPlan │  (aggregates across all domains)                          │
│  └──────────────┘                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.10 Index Catalog

| Model                    | Index      | Columns                            | Purpose                                  |
| ------------------------ | ---------- | ---------------------------------- | ---------------------------------------- |
| **Hotel**                | `@@unique` | `[tenantId, eventId, name]`        | Prevent duplicate hotels per event       |
| **RoomBlock**            | `@@index`  | `[hotelId]`                        | Fast lookup of blocks per hotel          |
| **RoomAssignment**       | `@@unique` | `[roomBlockId, participantId]`     | One assignment per participant per block |
| **RoomAssignment**       | `@@index`  | `[participantId]`                  | Find assignment by participant           |
| **RoomAssignment**       | `@@index`  | `[status]`                         | Filter by assignment status              |
| **TransportRequest**     | `@@index`  | `[eventId, scheduledTime]`         | Time-based schedule queries              |
| **TransportRequest**     | `@@index`  | `[eventId, status]`                | Status-based filtering                   |
| **TransportRequest**     | `@@index`  | `[driverId, scheduledTime]`        | Driver schedule lookup                   |
| **TransportRequest**     | `@@index`  | `[vehicleId, scheduledTime]`       | Vehicle schedule lookup                  |
| **Vehicle**              | `@@unique` | `[tenantId, eventId, plateNumber]` | Prevent duplicate plate numbers          |
| **Vehicle**              | `@@index`  | `[eventId, status]`                | Fleet status overview                    |
| **ShuttleRoute**         | `@@unique` | `[tenantId, eventId, name]`        | Prevent duplicate route names            |
| **MealPlan**             | `@@unique` | `[eventId, date, name]`            | One plan per name per date               |
| **MealPlan**             | `@@index`  | `[eventId]`                        | Event meal plan listing                  |
| **MealService**          | `@@index`  | `[mealPlanId, mealType]`           | Service lookup by type                   |
| **MealVoucher**          | `@@unique` | `[mealServiceId, participantId]`   | One voucher per service per person       |
| **MealVoucher**          | `@@index`  | `[participantId, status]`          | Participant voucher lookup               |
| **MealVoucher**          | `@@index`  | `[qrCode]`                         | Fast QR scan lookup                      |
| **MealCheckIn**          | `@@unique` | `[mealServiceId, participantId]`   | Prevent double check-in                  |
| **MealCheckIn**          | `@@index`  | `[mealServiceId, scannedAt]`       | Time-based consumption tracking          |
| **ParkingZone**          | `@@unique` | `[tenantId, eventId, code]`        | Prevent duplicate zone codes             |
| **ParkingPermit**        | `@@index`  | `[vehiclePlate]`                   | Plate-based permit lookup                |
| **ParkingPermit**        | `@@index`  | `[parkingZoneId, status]`          | Zone permit status overview              |
| **ParkingPermit**        | `@@index`  | `[participantId]`                  | Participant permit lookup                |
| **ParkingGateLog**       | `@@index`  | `[parkingZoneId, scannedAt]`       | Time-based gate log queries              |
| **ParkingGateLog**       | `@@index`  | `[vehiclePlate]`                   | Vehicle history lookup                   |
| **VenueFloorPlan**       | `@@unique` | `[venueId, name]`                  | One floor plan per name per venue        |
| **Room**                 | `@@unique` | `[venueId, name]`                  | Prevent duplicate room names             |
| **Room**                 | `@@index`  | `[venueId, isBookable]`            | Bookable room filtering                  |
| **RoomBooking**          | `@@index`  | `[roomId, startTime, endTime]`     | Conflict detection queries               |
| **RoomBooking**          | `@@index`  | `[eventId, startTime]`             | Event schedule overview                  |
| **RoomBooking**          | `@@index`  | `[status]`                         | Booking status filtering                 |
| **EventZone**            | `@@unique` | `[tenantId, eventId, code]`        | Prevent duplicate zone codes             |
| **EventZone**            | `@@index`  | `[eventId]`                        | Event zone listing                       |
| **ZoneAccessLog**        | `@@index`  | `[zoneId, scannedAt]`              | Time-based access queries                |
| **ZoneAccessLog**        | `@@index`  | `[participantId, scannedAt]`       | Participant movement tracking            |
| **InterZoneShuttle**     | `@@index`  | `[eventId, departureTime]`         | Shuttle schedule queries                 |
| **InterZoneShuttle**     | `@@index`  | `[fromZoneId]`                     | Departure zone lookup                    |
| **Vendor**               | `@@unique` | `[tenantId, name]`                 | Prevent duplicate vendor names           |
| **Vendor**               | `@@index`  | `[tenantId, category]`             | Category-based vendor filtering          |
| **Vendor**               | `@@index`  | `[tenantId, status]`               | Status-based vendor filtering            |
| **VendorContract**       | `@@index`  | `[vendorId]`                       | Vendor contract listing                  |
| **VendorContract**       | `@@index`  | `[eventId]`                        | Event contract listing                   |
| **VendorInvoice**        | `@@index`  | `[vendorId, status]`               | Vendor invoice tracking                  |
| **VendorInvoice**        | `@@index`  | `[contractId]`                     | Contract invoice listing                 |
| **VendorPerformanceLog** | `@@index`  | `[vendorId, eventId]`              | Performance tracking                     |
| **CapacityPlan**         | `@@unique` | `[tenantId, eventId, name]`        | One plan per name                        |
| **CapacityPlan**         | `@@index`  | `[eventId, status]`                | Active plan lookup                       |

---

## 4. API Specification

All endpoints require authentication via JWT and are scoped to `tenantId` (resolved from the token). Standard response envelope applies:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: any };
  meta?: { page: number; pageSize: number; total: number };
}
```

### 4.1 Accommodation API

#### Hotel Management

| Method   | Endpoint                                  | Description                      |
| -------- | ----------------------------------------- | -------------------------------- |
| `POST`   | `/api/v1/events/:eventId/hotels`          | Create a hotel record            |
| `GET`    | `/api/v1/events/:eventId/hotels`          | List all hotels for event        |
| `GET`    | `/api/v1/events/:eventId/hotels/:hotelId` | Get hotel details with occupancy |
| `PUT`    | `/api/v1/events/:eventId/hotels/:hotelId` | Update hotel details             |
| `DELETE` | `/api/v1/events/:eventId/hotels/:hotelId` | Remove hotel (cascades blocks)   |

#### Room Block Management

| Method   | Endpoint                                                               | Description              |
| -------- | ---------------------------------------------------------------------- | ------------------------ |
| `POST`   | `/api/v1/events/:eventId/hotels/:hotelId/blocks`                       | Create room block        |
| `GET`    | `/api/v1/events/:eventId/hotels/:hotelId/blocks`                       | List blocks for hotel    |
| `PUT`    | `/api/v1/events/:eventId/hotels/:hotelId/blocks/:blockId`              | Update block details     |
| `DELETE` | `/api/v1/events/:eventId/hotels/:hotelId/blocks/:blockId`              | Remove block             |
| `GET`    | `/api/v1/events/:eventId/hotels/:hotelId/blocks/:blockId/availability` | Check block availability |

#### Room Assignment

| Method  | Endpoint                                               | Description                              |
| ------- | ------------------------------------------------------ | ---------------------------------------- |
| `POST`  | `/api/v1/events/:eventId/room-assignments`             | Create manual assignment                 |
| `GET`   | `/api/v1/events/:eventId/room-assignments`             | List assignments with filters            |
| `GET`   | `/api/v1/events/:eventId/room-assignments/:id`         | Get assignment detail                    |
| `PUT`   | `/api/v1/events/:eventId/room-assignments/:id`         | Update assignment                        |
| `PATCH` | `/api/v1/events/:eventId/room-assignments/:id/status`  | Update status (check-in/out)             |
| `POST`  | `/api/v1/events/:eventId/room-assignments/auto-assign` | Run auto-assignment algorithm            |
| `GET`   | `/api/v1/events/:eventId/room-assignments/unassigned`  | List approved participants without rooms |
| `GET`   | `/api/v1/events/:eventId/rooming-lists`                | Generate rooming lists (PDF/Excel)       |
| `GET`   | `/api/v1/events/:eventId/rooming-lists/:hotelId`       | Generate rooming list for specific hotel |

```typescript
// POST /api/v1/events/:eventId/room-assignments/auto-assign
// Request body:
interface AutoAssignRequest {
  participantIds?: string[]; // Specific participants, or omit for all unassigned
  preferDelegationGrouping: boolean; // Try to keep delegations in same hotel
  respectProtocolRank: boolean; // Map rank to room type
}

// Response:
interface AutoAssignResponse {
  assigned: number;
  failed: number;
  details: Array<{
    participantId: string;
    participantName: string;
    hotel: string;
    roomType: string;
    status: "ASSIGNED" | "NO_AVAILABILITY" | "NO_MATCH";
    reason?: string;
  }>;
}
```

### 4.2 Transportation API

#### Vehicle Fleet Management

| Method   | Endpoint                                               | Description                |
| -------- | ------------------------------------------------------ | -------------------------- |
| `POST`   | `/api/v1/events/:eventId/vehicles`                     | Register vehicle           |
| `GET`    | `/api/v1/events/:eventId/vehicles`                     | List fleet with status     |
| `GET`    | `/api/v1/events/:eventId/vehicles/:vehicleId`          | Get vehicle details        |
| `PUT`    | `/api/v1/events/:eventId/vehicles/:vehicleId`          | Update vehicle             |
| `PATCH`  | `/api/v1/events/:eventId/vehicles/:vehicleId/status`   | Update vehicle status      |
| `DELETE` | `/api/v1/events/:eventId/vehicles/:vehicleId`          | Remove vehicle             |
| `GET`    | `/api/v1/events/:eventId/vehicles/:vehicleId/position` | Get real-time GPS position |
| `GET`    | `/api/v1/events/:eventId/vehicles/positions`           | Get all vehicle positions  |

#### Transport Request Management

| Method  | Endpoint                                                | Description                           |
| ------- | ------------------------------------------------------- | ------------------------------------- |
| `POST`  | `/api/v1/events/:eventId/transport-requests`            | Create transport request              |
| `GET`   | `/api/v1/events/:eventId/transport-requests`            | List requests with filters            |
| `GET`   | `/api/v1/events/:eventId/transport-requests/:id`        | Get request details                   |
| `PUT`   | `/api/v1/events/:eventId/transport-requests/:id`        | Update request                        |
| `PATCH` | `/api/v1/events/:eventId/transport-requests/:id/status` | Update status                         |
| `POST`  | `/api/v1/events/:eventId/transport-requests/:id/assign` | Assign vehicle and driver             |
| `GET`   | `/api/v1/events/:eventId/transport-requests/schedule`   | Get schedule (date range, Gantt data) |
| `GET`   | `/api/v1/events/:eventId/transport-manifest`            | Generate transport manifest (PDF)     |

#### Shuttle Route Management

| Method   | Endpoint                                                 | Description          |
| -------- | -------------------------------------------------------- | -------------------- |
| `POST`   | `/api/v1/events/:eventId/shuttle-routes`                 | Create shuttle route |
| `GET`    | `/api/v1/events/:eventId/shuttle-routes`                 | List routes          |
| `PUT`    | `/api/v1/events/:eventId/shuttle-routes/:routeId`        | Update route         |
| `PATCH`  | `/api/v1/events/:eventId/shuttle-routes/:routeId/toggle` | Activate/deactivate  |
| `DELETE` | `/api/v1/events/:eventId/shuttle-routes/:routeId`        | Remove route         |

```typescript
// POST /api/v1/events/:eventId/transport-requests/:id/assign
interface AssignVehicleRequest {
  vehicleId: string;
  driverId: string;
  notifyDriver: boolean; // Send SMS + push notification
  notifyPassenger: boolean; // Send confirmation email
}

// PATCH /api/v1/events/:eventId/transport-requests/:id/status
interface UpdateTransportStatusRequest {
  status: TransportStatus;
  latitude?: number; // Current GPS position
  longitude?: number;
  notes?: string;
}
```

### 4.3 Catering API

#### Meal Plan Management

| Method   | Endpoint                                          | Description               |
| -------- | ------------------------------------------------- | ------------------------- |
| `POST`   | `/api/v1/events/:eventId/meal-plans`              | Create meal plan          |
| `GET`    | `/api/v1/events/:eventId/meal-plans`              | List meal plans           |
| `GET`    | `/api/v1/events/:eventId/meal-plans/:planId`      | Get plan with services    |
| `PUT`    | `/api/v1/events/:eventId/meal-plans/:planId`      | Update plan               |
| `DELETE` | `/api/v1/events/:eventId/meal-plans/:planId`      | Remove plan               |
| `POST`   | `/api/v1/events/:eventId/meal-plans/:planId/copy` | Copy plan to another date |

#### Meal Service Management

| Method   | Endpoint                                                             | Description             |
| -------- | -------------------------------------------------------------------- | ----------------------- |
| `POST`   | `/api/v1/events/:eventId/meal-plans/:planId/services`                | Add meal service        |
| `PUT`    | `/api/v1/events/:eventId/meal-services/:serviceId`                   | Update service          |
| `DELETE` | `/api/v1/events/:eventId/meal-services/:serviceId`                   | Remove service          |
| `GET`    | `/api/v1/events/:eventId/meal-services/:serviceId/dietary-breakdown` | Get dietary aggregation |

#### Voucher & Scanning

| Method | Endpoint                                                             | Description                                 |
| ------ | -------------------------------------------------------------------- | ------------------------------------------- |
| `POST` | `/api/v1/events/:eventId/meal-services/:serviceId/vouchers/generate` | Generate vouchers for eligible participants |
| `GET`  | `/api/v1/events/:eventId/meal-vouchers`                              | List vouchers (filterable)                  |
| `POST` | `/api/v1/events/:eventId/meal-vouchers/scan`                         | Scan QR code for meal check-in              |
| `GET`  | `/api/v1/events/:eventId/meal-services/:serviceId/live-stats`        | Real-time collection stats                  |
| `GET`  | `/api/v1/events/:eventId/catering-dashboard`                         | Vendor dashboard data                       |

```typescript
// POST /api/v1/events/:eventId/meal-vouchers/scan
interface MealScanRequest {
  qrCode: string;
  mealServiceId: string;
  stationId?: string;
}

interface MealScanResponse {
  result: "PASS" | "FAIL";
  participantName?: string;
  dietaryType?: DietaryType;
  message: string;
  timestamp: string;
  // Only on FAIL:
  failReason?: "ALREADY_COLLECTED" | "WRONG_SERVICE" | "EXPIRED" | "INVALID" | "NOT_FOUND";
  collectedAt?: string; // If already collected
}

// GET /api/v1/events/:eventId/meal-services/:serviceId/live-stats
interface MealLiveStats {
  serviceId: string;
  mealType: MealType;
  totalExpected: number;
  totalCollected: number;
  collectionPercent: number;
  collectionRate: number; // per minute
  estimatedCompletion: string; // ISO datetime
  byDietary: Array<{
    type: DietaryType;
    expected: number;
    collected: number;
  }>;
}
```

### 4.4 Parking API

#### Parking Zone Management

| Method   | Endpoint                                         | Description                  |
| -------- | ------------------------------------------------ | ---------------------------- |
| `POST`   | `/api/v1/events/:eventId/parking-zones`          | Create parking zone          |
| `GET`    | `/api/v1/events/:eventId/parking-zones`          | List zones with occupancy    |
| `GET`    | `/api/v1/events/:eventId/parking-zones/:zoneId`  | Get zone details             |
| `PUT`    | `/api/v1/events/:eventId/parking-zones/:zoneId`  | Update zone                  |
| `DELETE` | `/api/v1/events/:eventId/parking-zones/:zoneId`  | Remove zone                  |
| `GET`    | `/api/v1/events/:eventId/parking-zones/overview` | Real-time occupancy overview |

#### Parking Permit Management

| Method  | Endpoint                                                     | Description                         |
| ------- | ------------------------------------------------------------ | ----------------------------------- |
| `POST`  | `/api/v1/events/:eventId/parking-permits`                    | Issue permit                        |
| `GET`   | `/api/v1/events/:eventId/parking-permits`                    | List permits (filterable)           |
| `GET`   | `/api/v1/events/:eventId/parking-permits/:permitId`          | Get permit details                  |
| `PATCH` | `/api/v1/events/:eventId/parking-permits/:permitId/status`   | Update status (revoke/suspend)      |
| `POST`  | `/api/v1/events/:eventId/parking-permits/auto-generate`      | Auto-generate from approved drivers |
| `GET`   | `/api/v1/events/:eventId/parking-permits/:permitId/car-pass` | Generate car pass PDF               |

#### Gate Scanning

| Method | Endpoint                                                  | Description           |
| ------ | --------------------------------------------------------- | --------------------- |
| `POST` | `/api/v1/events/:eventId/parking-gates/scan`              | Scan car pass at gate |
| `GET`  | `/api/v1/events/:eventId/parking-zones/:zoneId/gate-logs` | Gate log history      |

```typescript
// POST /api/v1/events/:eventId/parking-gates/scan
interface ParkingGateScanRequest {
  qrPayload: string;
  zoneId: string;
  direction: "ENTRY" | "EXIT";
}

interface ParkingGateScanResponse {
  result: "ALLOWED" | "DENIED_FULL" | "DENIED_ACCESS" | "DENIED_EXPIRED" | "DENIED_INVALID";
  permitNumber?: string;
  vehiclePlate?: string;
  zoneName?: string;
  zoneOccupancy?: number;
  zoneCapacity?: number;
  message: string;
  alternativeZone?: string; // Suggested if denied due to full
}
```

### 4.5 Venue & Floor Plan API

#### Venue & Room Management

| Method   | Endpoint                                | Description                     |
| -------- | --------------------------------------- | ------------------------------- |
| `GET`    | `/api/v1/venues`                        | List venues for tenant          |
| `GET`    | `/api/v1/venues/:venueId`               | Get venue with floors and rooms |
| `GET`    | `/api/v1/venues/:venueId/rooms`         | List rooms for venue            |
| `POST`   | `/api/v1/venues/:venueId/rooms`         | Create room                     |
| `PUT`    | `/api/v1/venues/:venueId/rooms/:roomId` | Update room                     |
| `DELETE` | `/api/v1/venues/:venueId/rooms/:roomId` | Remove room                     |

#### Floor Plan Management

| Method   | Endpoint                                               | Description                      |
| -------- | ------------------------------------------------------ | -------------------------------- |
| `POST`   | `/api/v1/venues/:venueId/floor-plans`                  | Create floor plan (upload image) |
| `GET`    | `/api/v1/venues/:venueId/floor-plans`                  | List floor plans                 |
| `GET`    | `/api/v1/venues/:venueId/floor-plans/:planId`          | Get floor plan with elements     |
| `PUT`    | `/api/v1/venues/:venueId/floor-plans/:planId`          | Update floor plan metadata       |
| `PUT`    | `/api/v1/venues/:venueId/floor-plans/:planId/image`    | Replace floor plan image         |
| `PUT`    | `/api/v1/venues/:venueId/floor-plans/:planId/zones`    | Update zone overlays             |
| `PUT`    | `/api/v1/venues/:venueId/floor-plans/:planId/elements` | Update element placements        |
| `DELETE` | `/api/v1/venues/:venueId/floor-plans/:planId`          | Remove floor plan                |

#### Room Booking

| Method   | Endpoint                                                  | Description                   |
| -------- | --------------------------------------------------------- | ----------------------------- |
| `POST`   | `/api/v1/events/:eventId/room-bookings`                   | Create booking                |
| `GET`    | `/api/v1/events/:eventId/room-bookings`                   | List bookings (calendar data) |
| `GET`    | `/api/v1/events/:eventId/room-bookings/:bookingId`        | Get booking details           |
| `PUT`    | `/api/v1/events/:eventId/room-bookings/:bookingId`        | Update booking                |
| `PATCH`  | `/api/v1/events/:eventId/room-bookings/:bookingId/status` | Update status                 |
| `DELETE` | `/api/v1/events/:eventId/room-bookings/:bookingId`        | Cancel booking                |
| `POST`   | `/api/v1/events/:eventId/room-bookings/check-conflicts`   | Check for conflicts           |

```typescript
// POST /api/v1/events/:eventId/room-bookings/check-conflicts
interface ConflictCheckRequest {
  roomId: string;
  startTime: string; // ISO datetime
  endTime: string;
  setupTime?: number; // minutes
  teardownTime?: number;
  excludeBookingId?: string; // Exclude when editing existing booking
}

interface ConflictCheckResponse {
  hasConflicts: boolean;
  conflicts: Array<{
    bookingId: string;
    title: string;
    startTime: string;
    endTime: string;
    status: RoomBookingStatus;
  }>;
  capacityCheck: {
    roomCapacity: number;
    requestedAttendees?: number;
    sufficient: boolean;
  };
  equipmentCheck: {
    available: string[];
    missing: string[];
  };
}
```

### 4.6 Zone Coordination API

| Method   | Endpoint                                            | Description                   |
| -------- | --------------------------------------------------- | ----------------------------- |
| `POST`   | `/api/v1/events/:eventId/zones`                     | Create event zone             |
| `GET`    | `/api/v1/events/:eventId/zones`                     | List zones with occupancy     |
| `GET`    | `/api/v1/events/:eventId/zones/:zoneId`             | Get zone detail               |
| `PUT`    | `/api/v1/events/:eventId/zones/:zoneId`             | Update zone                   |
| `DELETE` | `/api/v1/events/:eventId/zones/:zoneId`             | Remove zone                   |
| `GET`    | `/api/v1/events/:eventId/zones/:zoneId/dashboard`   | Zone operations dashboard     |
| `GET`    | `/api/v1/events/:eventId/zones/:zoneId/access-logs` | Zone access log history       |
| `POST`   | `/api/v1/events/:eventId/zones/scan`                | Zone access scan              |
| `GET`    | `/api/v1/events/:eventId/travel-time-matrix`        | Travel time between all zones |
| `PUT`    | `/api/v1/events/:eventId/travel-time-matrix`        | Update travel times           |

#### Inter-Zone Shuttle

| Method  | Endpoint                                                 | Description                   |
| ------- | -------------------------------------------------------- | ----------------------------- |
| `POST`  | `/api/v1/events/:eventId/inter-zone-shuttles`            | Schedule shuttle              |
| `GET`   | `/api/v1/events/:eventId/inter-zone-shuttles`            | List shuttles                 |
| `PATCH` | `/api/v1/events/:eventId/inter-zone-shuttles/:id/status` | Update shuttle status         |
| `GET`   | `/api/v1/events/:eventId/inter-zone-shuttles/schedule`   | Shuttle schedule (Gantt data) |

```typescript
// GET /api/v1/events/:eventId/travel-time-matrix
interface TravelTimeMatrix {
  zones: Array<{ id: string; name: string; code: string }>;
  matrix: Array<
    Array<{
      walkingMinutes: number | null; // null if not walkable
      shuttleMinutes: number | null;
      drivingMinutes: number | null;
      nextShuttle?: string; // ISO datetime of next shuttle
    }>
  >;
}

// POST /api/v1/events/:eventId/zones/scan
interface ZoneScanRequest {
  zoneId: string;
  participantId?: string;
  staffId?: string;
  direction: "ENTRY" | "EXIT";
  badgeQrCode?: string;
}

interface ZoneScanResponse {
  result: "ALLOWED" | "DENIED_ACCESS" | "DENIED_CAPACITY" | "DENIED_HOURS";
  personName?: string;
  zoneName: string;
  currentOccupancy: number;
  capacity: number;
  message: string;
}
```

### 4.7 Vendor Management API

| Method  | Endpoint                                                 | Description                                   |
| ------- | -------------------------------------------------------- | --------------------------------------------- |
| `POST`  | `/api/v1/vendors`                                        | Create vendor                                 |
| `GET`   | `/api/v1/vendors`                                        | List vendors (filterable by category, status) |
| `GET`   | `/api/v1/vendors/:vendorId`                              | Get vendor details                            |
| `PUT`   | `/api/v1/vendors/:vendorId`                              | Update vendor                                 |
| `POST`  | `/api/v1/vendors/:vendorId/contracts`                    | Create contract                               |
| `GET`   | `/api/v1/vendors/:vendorId/contracts`                    | List contracts                                |
| `PUT`   | `/api/v1/vendors/:vendorId/contracts/:contractId`        | Update contract                               |
| `PATCH` | `/api/v1/vendors/:vendorId/contracts/:contractId/status` | Approve/terminate contract                    |
| `POST`  | `/api/v1/vendors/:vendorId/invoices`                     | Submit invoice                                |
| `GET`   | `/api/v1/vendors/:vendorId/invoices`                     | List invoices                                 |
| `PATCH` | `/api/v1/vendors/:vendorId/invoices/:invoiceId/status`   | Approve/pay/dispute invoice                   |
| `POST`  | `/api/v1/vendors/:vendorId/performance`                  | Log performance rating                        |
| `GET`   | `/api/v1/vendors/:vendorId/performance`                  | Get performance history                       |
| `POST`  | `/api/v1/vendors/:vendorId/portal-access`                | Generate vendor portal URL                    |

---

## 5. Business Logic

### 5.1 Room Assignment Optimization

#### 5.1.1 Auto-Assignment Algorithm (Source)

```
When participant status reaches APPROVED:
  -> System reads participant's type and protocol rank
  -> Protocol rank mapping:
      Head of State     -> Presidential Suite
      Minister          -> Suite
      Ambassador        -> Executive Room
      Delegate          -> Double Room
      Support Staff     -> Single Room (may share)
      Security          -> Single Room

  -> Find matching RoomBlock:
    1. Filter by participantTypeId matching participant's type
    2. Filter by date range overlapping participant's travel dates
    3. Sort by hotel preference (delegation's preferred hotel, if specified)
    4. Check availability: block.quantity > assigned count
    5. If match found -> create RoomAssignment (status: RESERVED)
    6. If no match -> flag for manual assignment, notify admin

  -> Delegation grouping preference:
    - Try to assign same delegation to same hotel
    - Head of delegation in same hotel as their delegation
    - If hotel is full, overflow to nearest alternative
```

#### 5.1.2 Constraint Satisfaction Engine

The auto-assignment algorithm is implemented as a constraint satisfaction solver that processes all unassigned participants in a single batch for optimal global assignment.

```typescript
// src/logistics/accommodation/room-assignment.optimizer.ts

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

interface AssignmentConstraint {
  type: "HARD" | "SOFT";
  name: string;
  weight: number; // 0-100, only for SOFT constraints
}

interface ParticipantRequirement {
  participantId: string;
  participantName: string;
  delegationId: string;
  delegationName: string;
  protocolRank: string;
  requiredRoomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  accessibilityNeeds: boolean;
  preferredHotelId?: string;
  specialRequests?: string;
}

interface AvailableRoom {
  blockId: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  availableCount: number;
  checkInDate: Date;
  checkOutDate: Date;
  floor?: number;
  isAccessible?: boolean;
  pricePerNight?: number;
}

interface AssignmentResult {
  participantId: string;
  blockId: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  score: number;
  constraintViolations: string[];
}

@Injectable()
export class RoomAssignmentOptimizer {
  private readonly logger = new Logger(RoomAssignmentOptimizer.name);

  // Hard constraints (must be satisfied)
  private readonly HARD_CONSTRAINTS: AssignmentConstraint[] = [
    { type: "HARD", name: "ROOM_TYPE_MATCH", weight: 100 },
    { type: "HARD", name: "DATE_OVERLAP", weight: 100 },
    { type: "HARD", name: "AVAILABILITY", weight: 100 },
  ];

  // Soft constraints (optimized but not required)
  private readonly SOFT_CONSTRAINTS: AssignmentConstraint[] = [
    { type: "SOFT", name: "DELEGATION_PROXIMITY", weight: 80 },
    { type: "SOFT", name: "VIP_FLOOR_PREFERENCE", weight: 70 },
    { type: "SOFT", name: "ACCESSIBILITY_NEEDS", weight: 90 },
    { type: "SOFT", name: "PREFERRED_HOTEL", weight: 60 },
    { type: "SOFT", name: "COST_OPTIMIZATION", weight: 40 },
    { type: "SOFT", name: "HOTEL_BALANCE", weight: 30 },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async optimizeAssignments(
    tenantId: string,
    eventId: string,
    participantIds?: string[],
  ): Promise<{
    assignments: AssignmentResult[];
    unassigned: Array<{ participantId: string; reason: string }>;
    stats: { total: number; assigned: number; failed: number; runtime: number };
  }> {
    const startTime = Date.now();

    // Step 1: Gather all unassigned participants
    const requirements = await this.gatherRequirements(tenantId, eventId, participantIds);
    this.logger.log(`Processing ${requirements.length} participants for room assignment`);

    // Step 2: Gather all available room blocks
    const availableRooms = await this.gatherAvailability(tenantId, eventId);
    this.logger.log(`Found ${availableRooms.length} available room blocks`);

    // Step 3: Sort participants by priority (VIP first, then by delegation size)
    const sortedRequirements = this.prioritizeParticipants(requirements);

    // Step 4: Group by delegation for proximity optimization
    const delegationGroups = this.groupByDelegation(sortedRequirements);

    // Step 5: Assign rooms using greedy constraint satisfaction
    const assignments: AssignmentResult[] = [];
    const unassigned: Array<{ participantId: string; reason: string }> = [];
    const remainingAvailability = new Map(availableRooms.map((r) => [r.blockId, r.availableCount]));

    for (const [delegationId, members] of delegationGroups) {
      // Find best hotel for the delegation (maximize members in same hotel)
      const delegationHotel = this.findBestDelegationHotel(
        members,
        availableRooms,
        remainingAvailability,
      );

      for (const participant of members) {
        const result = this.assignParticipant(
          participant,
          availableRooms,
          remainingAvailability,
          delegationHotel,
          assignments,
        );

        if (result) {
          assignments.push(result);
          const current = remainingAvailability.get(result.blockId) ?? 0;
          remainingAvailability.set(result.blockId, current - 1);
        } else {
          unassigned.push({
            participantId: participant.participantId,
            reason: this.getFailureReason(participant, availableRooms, remainingAvailability),
          });
        }
      }
    }

    // Step 6: Persist assignments
    await this.persistAssignments(assignments);

    const runtime = Date.now() - startTime;
    this.logger.log(
      `Assignment complete: ${assignments.length} assigned, ${unassigned.length} failed in ${runtime}ms`,
    );

    return {
      assignments,
      unassigned,
      stats: {
        total: requirements.length,
        assigned: assignments.length,
        failed: unassigned.length,
        runtime,
      },
    };
  }

  private assignParticipant(
    participant: ParticipantRequirement,
    allRooms: AvailableRoom[],
    availability: Map<string, number>,
    preferredHotelId: string | null,
    existingAssignments: AssignmentResult[],
  ): AssignmentResult | null {
    // Filter rooms that satisfy hard constraints
    const candidates = allRooms.filter((room) => {
      // Hard: Room type must match
      if (room.roomType !== participant.requiredRoomType) return false;
      // Hard: Dates must overlap
      if (
        room.checkInDate > participant.checkInDate ||
        room.checkOutDate < participant.checkOutDate
      )
        return false;
      // Hard: Must have availability
      if ((availability.get(room.blockId) ?? 0) <= 0) return false;
      return true;
    });

    if (candidates.length === 0) return null;

    // Score each candidate on soft constraints
    const scored = candidates.map((room) => ({
      room,
      score: this.scoreCandidate(room, participant, preferredHotelId, existingAssignments),
      violations: this.getViolations(room, participant),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    return {
      participantId: participant.participantId,
      blockId: best.room.blockId,
      hotelId: best.room.hotelId,
      hotelName: best.room.hotelName,
      roomType: best.room.roomType,
      score: best.score,
      constraintViolations: best.violations,
    };
  }

  private scoreCandidate(
    room: AvailableRoom,
    participant: ParticipantRequirement,
    preferredHotelId: string | null,
    existingAssignments: AssignmentResult[],
  ): number {
    let score = 0;

    // Delegation proximity: bonus if same hotel as other delegation members
    const delegationInHotel = existingAssignments.filter((a) => a.hotelId === room.hotelId).length;
    score +=
      delegationInHotel *
      this.SOFT_CONSTRAINTS.find((c) => c.name === "DELEGATION_PROXIMITY")!.weight;

    // VIP floor preference: heads of state on top floors
    if (["Head of State", "Minister"].includes(participant.protocolRank)) {
      if (room.floor && room.floor >= 10) {
        score += this.SOFT_CONSTRAINTS.find((c) => c.name === "VIP_FLOOR_PREFERENCE")!.weight;
      }
    }

    // Accessibility: match accessible rooms to participants with needs
    if (participant.accessibilityNeeds && room.isAccessible) {
      score += this.SOFT_CONSTRAINTS.find((c) => c.name === "ACCESSIBILITY_NEEDS")!.weight;
    }

    // Preferred hotel match
    if (preferredHotelId && room.hotelId === preferredHotelId) {
      score += this.SOFT_CONSTRAINTS.find((c) => c.name === "PREFERRED_HOTEL")!.weight;
    }

    // Cost optimization: prefer lower-cost rooms for non-VIP
    if (!["Head of State", "Minister", "Ambassador"].includes(participant.protocolRank)) {
      if (room.pricePerNight) {
        score += Math.max(0, 50 - room.pricePerNight / 10); // Lower price = higher score
      }
    }

    return score;
  }

  private prioritizeParticipants(participants: ParticipantRequirement[]): ParticipantRequirement[] {
    const rankOrder: Record<string, number> = {
      "Head of State": 1,
      Minister: 2,
      Ambassador: 3,
      Delegate: 4,
      "Support Staff": 5,
      Security: 6,
    };
    return [...participants].sort(
      (a, b) => (rankOrder[a.protocolRank] ?? 99) - (rankOrder[b.protocolRank] ?? 99),
    );
  }

  private groupByDelegation(
    participants: ParticipantRequirement[],
  ): Map<string, ParticipantRequirement[]> {
    const groups = new Map<string, ParticipantRequirement[]>();
    for (const p of participants) {
      const key = p.delegationId || "UNAFFILIATED";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    // Sort delegations by size descending (larger delegations assigned first for better grouping)
    return new Map([...groups.entries()].sort((a, b) => b[1].length - a[1].length));
  }

  private findBestDelegationHotel(
    members: ParticipantRequirement[],
    rooms: AvailableRoom[],
    availability: Map<string, number>,
  ): string | null {
    // Find hotel that can accommodate the most members of this delegation
    const hotelCapacity = new Map<string, number>();
    for (const room of rooms) {
      const avail = availability.get(room.blockId) ?? 0;
      if (avail <= 0) continue;
      const current = hotelCapacity.get(room.hotelId) ?? 0;
      hotelCapacity.set(room.hotelId, current + avail);
    }

    let bestHotel: string | null = null;
    let bestCapacity = 0;
    for (const [hotelId, capacity] of hotelCapacity) {
      if (capacity >= members.length && capacity > bestCapacity) {
        bestHotel = hotelId;
        bestCapacity = capacity;
      }
    }
    return bestHotel;
  }

  private getFailureReason(
    participant: ParticipantRequirement,
    rooms: AvailableRoom[],
    availability: Map<string, number>,
  ): string {
    const typeMatch = rooms.filter((r) => r.roomType === participant.requiredRoomType);
    if (typeMatch.length === 0) {
      return `No room blocks of type "${participant.requiredRoomType}" configured`;
    }
    const dateMatch = typeMatch.filter(
      (r) => r.checkInDate <= participant.checkInDate && r.checkOutDate >= participant.checkOutDate,
    );
    if (dateMatch.length === 0) {
      return `No "${participant.requiredRoomType}" blocks covering dates ${participant.checkInDate.toISOString()} - ${participant.checkOutDate.toISOString()}`;
    }
    return `All "${participant.requiredRoomType}" blocks are fully assigned`;
  }

  private getViolations(room: AvailableRoom, participant: ParticipantRequirement): string[] {
    const violations: string[] = [];
    if (participant.accessibilityNeeds && !room.isAccessible) {
      violations.push("Room is not accessibility-compliant");
    }
    return violations;
  }

  private async gatherRequirements(
    tenantId: string,
    eventId: string,
    participantIds?: string[],
  ): Promise<ParticipantRequirement[]> {
    // Query approved participants without room assignments
    // Map protocol rank to required room type
    return []; // placeholder
  }

  private async gatherAvailability(tenantId: string, eventId: string): Promise<AvailableRoom[]> {
    // Query all room blocks with remaining availability
    return []; // placeholder
  }

  private async persistAssignments(assignments: AssignmentResult[]): Promise<void> {
    // Bulk create RoomAssignment records
    await this.prisma.$transaction(
      assignments.map((a) =>
        this.prisma.roomAssignment.create({
          data: {
            roomBlockId: a.blockId,
            participantId: a.participantId,
            checkInDate: new Date(), // from participant data
            checkOutDate: new Date(),
            status: "RESERVED",
            assignedBy: "SYSTEM",
          },
        }),
      ),
    );
  }
}
```

#### 5.1.3 Rooming List Export

```
Admin clicks [Generate Rooming Lists]
  -> Select hotel (or all hotels)
  -> System generates PDF/Excel per hotel:
    +-------------------------------------------------------------+
    | ROOMING LIST -- Sheraton Addis Ababa                         |
    | 38th AU Summit  |  Feb 10-17, 2026                          |
    +----+---------------+----------+--------+------+--------+
    |Room| Guest         | Country  | Type   | In   | Out    |
    +----+---------------+----------+--------+------+--------+
    |1201| H.E. W. Ruto  | Kenya    | Pres.  |Feb 10| Feb 16 |
    |1202| Security      | Kenya    | Single |Feb 10| Feb 16 |
    | 802| Min. Omamo    | Kenya    | Suite  |Feb 11| Feb 15 |
    | ...|               |          |        |      |        |
    +----+---------------+----------+--------+------+--------+
  -> Emailed to hotel contact or downloaded
```

#### 5.1.4 Overbooking Management

```typescript
// src/logistics/accommodation/overbooking.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class OverbookingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Manages strategic overbooking based on historical no-show rates.
   * Allows blocks to be overbooked by a configurable percentage.
   */
  async calculateOverbookingLimit(
    hotelId: string,
    roomType: string,
  ): Promise<{
    blockQuantity: number;
    currentAssigned: number;
    overbookingPercent: number;
    effectiveCapacity: number;
    remainingSlots: number;
  }> {
    const blocks = await this.prisma.roomBlock.findMany({
      where: { hotelId, roomType },
      include: {
        assignments: { where: { status: { not: "CANCELLED" } } },
      },
    });

    const totalQuantity = blocks.reduce((sum, b) => sum + b.quantity, 0);
    const totalAssigned = blocks.reduce((sum, b) => sum + b.assignments.length, 0);

    // Historical no-show rate (configurable, default 8%)
    const noShowRate = 0.08;
    const overbookingPercent = Math.min(noShowRate * 100, 15); // Cap at 15%
    const effectiveCapacity = Math.floor(totalQuantity * (1 + noShowRate));

    return {
      blockQuantity: totalQuantity,
      currentAssigned: totalAssigned,
      overbookingPercent,
      effectiveCapacity,
      remainingSlots: effectiveCapacity - totalAssigned,
    };
  }

  /**
   * When a no-show is detected, release the room and attempt to assign
   * to the next waitlisted participant.
   */
  async handleNoShow(assignmentId: string): Promise<void> {
    await this.prisma.roomAssignment.update({
      where: { id: assignmentId },
      data: { status: "NO_SHOW" },
    });

    // Trigger re-assignment for waitlisted participants
    // Event emitted to the assignment optimizer
  }
}
```

### 5.2 Transport Route Optimization

#### 5.2.1 Airport Pickup Scheduling Flow (Source)

```
Participant registers with flight data (flightNumber, arrivalTime, terminal)
  -> When participant reaches APPROVED status:
    -> System auto-creates TransportRequest:
        type: AIRPORT_PICKUP
        scheduledTime: flightArrivalTime + 45 min (baggage + customs buffer)
        pickupLocation: "Bole International Airport, Terminal 2"
        dropoffLocation: participant's assigned hotel (from Accommodation)
    -> Vehicle assignment algorithm:
        1. Check participant protocol level:
           Head of State -> dedicated SUV + motorcycle escort -> MOTORCADE
           Minister -> dedicated sedan
           Delegate -> shared van (group by arrival window +/- 30 min)
        2. Find available vehicle of matching type for that time slot
        3. Assign vehicle and driver
        4. TransportRequest.status -> DRIVER_ASSIGNED
    -> Driver receives notification (SMS + app push):
        "Pickup: H.E. John Doe, Flight ET502, Terminal 2, 14:30"
    -> Participant receives confirmation email:
        "Your driver will meet you at Terminal 2 arrivals. Vehicle: Toyota Land Cruiser, Plate: AA-1234"

  On event day:
    -> Driver marks EN_ROUTE_PICKUP when departing for airport
    -> Driver marks PASSENGER_COLLECTED when participant is in vehicle
    -> Driver marks COMPLETED at dropoff
    -> If no pickup 60 min after scheduled time -> alert to operations
```

#### 5.2.2 Route Optimization Algorithm

```typescript
// src/logistics/transport/route-optimizer.service.ts

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

interface OptimizedRoute {
  vehicleId: string;
  driverId: string;
  stops: Array<{
    requestId: string;
    location: string;
    arrivalTime: Date;
    departureTime: Date;
    passengers: string[];
    action: "PICKUP" | "DROPOFF";
  }>;
  totalDistanceKm: number;
  totalTimeMinutes: number;
  utilizationPercent: number; // passengers / capacity
}

interface TimeWindow {
  earliest: Date;
  latest: Date;
}

@Injectable()
export class RouteOptimizerService {
  private readonly logger = new Logger(RouteOptimizerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Optimizes transport routes for a given time window, minimizing:
   * 1. Total travel time across all vehicles
   * 2. Number of vehicles used
   * 3. Passenger wait time
   *
   * Subject to constraints:
   * - Time windows for airport pickups (flight arrival + buffer)
   * - Vehicle capacity limits
   * - VIP dedicated vehicle requirements
   * - Driver duty hour limits
   */
  async optimizeRoutes(
    tenantId: string,
    eventId: string,
    timeWindow: TimeWindow,
  ): Promise<OptimizedRoute[]> {
    // Step 1: Fetch all pending/confirmed requests in time window
    const requests = await this.prisma.transportRequest.findMany({
      where: {
        tenantId,
        eventId,
        scheduledTime: { gte: timeWindow.earliest, lte: timeWindow.latest },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { scheduledTime: "asc" },
    });

    // Step 2: Separate VIP (dedicated) from groupable requests
    const vipRequests = requests.filter((r) => r.type === "MOTORCADE" || r.passengerCount === 1);
    const groupableRequests = requests.filter((r) => r.type !== "MOTORCADE");

    // Step 3: Fetch available vehicles
    const vehicles = await this.prisma.vehicle.findMany({
      where: { tenantId, eventId, status: "AVAILABLE" },
      orderBy: { capacity: "desc" },
    });

    // Step 4: Assign VIP requests to dedicated vehicles
    const vipRoutes = this.assignVipRoutes(vipRequests, vehicles);

    // Step 5: Group remaining requests by proximity and time window
    const groups = this.groupByProximityAndTime(groupableRequests, 30); // 30 min window

    // Step 6: Assign grouped requests to vehicles (bin packing)
    const groupRoutes = this.assignGroupedRoutes(groups, vehicles);

    return [...vipRoutes, ...groupRoutes];
  }

  /**
   * Dynamic re-routing: when a flight is delayed, recalculate affected routes.
   */
  async handleFlightDelay(
    requestId: string,
    newArrivalTime: Date,
  ): Promise<{
    affectedRequests: string[];
    rescheduled: boolean;
    newScheduledTime: Date;
  }> {
    const request = await this.prisma.transportRequest.findUniqueOrThrow({
      where: { id: requestId },
    });

    const newScheduledTime = new Date(newArrivalTime.getTime() + 45 * 60000);

    // Update the request
    await this.prisma.transportRequest.update({
      where: { id: requestId },
      data: {
        flightArrivalTime: newArrivalTime,
        scheduledTime: newScheduledTime,
        notes: `Flight delayed. Original: ${request.scheduledTime.toISOString()}`,
      },
    });

    // Check if vehicle/driver can still make it
    const vehicleConflicts = await this.checkVehicleConflicts(request.vehicleId!, newScheduledTime);

    if (vehicleConflicts.length > 0) {
      // Re-assign vehicle
      this.logger.warn(`Vehicle conflict for delayed flight, re-assigning`);
    }

    return {
      affectedRequests: [requestId],
      rescheduled: true,
      newScheduledTime,
    };
  }

  /**
   * Groups transport requests that can share a vehicle based on:
   * - Pickup location proximity
   * - Scheduled time within windowMinutes of each other
   * - Same dropoff area
   */
  private groupByProximityAndTime(requests: any[], windowMinutes: number): any[][] {
    const groups: any[][] = [];
    const assigned = new Set<string>();

    for (const request of requests) {
      if (assigned.has(request.id)) continue;

      const group = [request];
      assigned.add(request.id);

      for (const other of requests) {
        if (assigned.has(other.id)) continue;

        const timeDiff =
          Math.abs(request.scheduledTime.getTime() - other.scheduledTime.getTime()) / 60000;

        if (timeDiff <= windowMinutes && request.pickupLocation === other.pickupLocation) {
          group.push(other);
          assigned.add(other.id);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  private assignVipRoutes(requests: any[], vehicles: any[]): OptimizedRoute[] {
    // Each VIP gets a dedicated vehicle
    return [];
  }

  private assignGroupedRoutes(groups: any[][], vehicles: any[]): OptimizedRoute[] {
    // Bin-packing: assign groups to vehicles respecting capacity
    return [];
  }

  private async checkVehicleConflicts(vehicleId: string, newTime: Date): Promise<any[]> {
    return this.prisma.transportRequest.findMany({
      where: {
        vehicleId,
        scheduledTime: {
          gte: new Date(newTime.getTime() - 60 * 60000),
          lte: new Date(newTime.getTime() + 60 * 60000),
        },
        status: { not: "CANCELLED" },
      },
    });
  }
}
```

#### 5.2.3 Transport Manifest Generation

```
Admin clicks [Generate Manifest] -> Select date
  -> System produces PDF grouped by time slot:

  +--------------------------------------------------------------+
  | TRANSPORT MANIFEST -- February 10, 2026                       |
  +------+--------+-------------------+----------+--------------+
  | Time | Type   | Passengers        | Vehicle  | Driver       |
  +------+--------+-------------------+----------+--------------+
  |14:00 |Pickup  | H.E. W. Ruto (KEN)| LC-001   | Tadesse B.  |
  |      |ET502   | + 2 security      | + escort |              |
  |14:30 |Pickup  | Min. Omamo (KEN)  | SD-005   | Hailu M.    |
  |      |ET714   | Dr. Juma (KEN)    |          |              |
  |15:00 |Shuttle | 18 delegates      | BUS-002  | Kebede A.   |
  |      |Run 13  | Hotel Zone->Venue |          |              |
  | ...  |        |                   |          |              |
  +------+--------+-------------------+----------+--------------+
```

### 5.3 Meal Count Forecasting

#### 5.3.1 Dietary Aggregation Algorithm (Source)

Dietary requirements are captured during registration as a custom field on the participant form (e.g., `dietary_preference` with options matching the `DietaryType` enum). The aggregation pipeline runs on demand or on a schedule:

```
For each MealService in the event:
  1. Query all participants eligible for this meal
     (based on participantType, accreditation status = APPROVED, and event day)
  2. For each participant, read customData.dietary_preference
     -> If missing or unrecognized, default to STANDARD
  3. Group by DietaryType -> produce counts
  4. Apply buffer multiplier (configurable, default 1.10 for 10% overage)
  5. Store as cached aggregation for vendor portal display

Output example:
  Lunch - Day 2 (Feb 11) - Restaurant Level 2
  +----------------+-------+------------+
  | Dietary Type   | Count | With Buffer|
  +----------------+-------+------------+
  | STANDARD       |   340 |        374 |
  | VEGETARIAN     |    45 |         50 |
  | HALAL          |    22 |         25 |
  | VEGAN          |    18 |         20 |
  | KOSHER         |     8 |          9 |
  | GLUTEN_FREE    |    12 |         14 |
  | DAIRY_FREE     |     6 |          7 |
  | NUT_FREE       |     4 |          5 |
  +----------------+-------+------------+
  | TOTAL          |   455 |        504 |
  +----------------+-------+------------+
```

When a new participant is approved or an existing participant updates their dietary preference, the cached aggregation is invalidated and recalculated on next view.

#### 5.3.2 QR Voucher Scanning Flow (Source)

```
Staff opens Meal Check-In scanner (mobile or tablet)
  -> Selects current MealService from today's list (auto-detected by time)
  -> Camera activates

Participant presents badge QR or printed meal voucher
  -> Staff scans QR code
  -> System decodes -> looks up MealVoucher by qrCode
  -> Validates:
     - Voucher exists and belongs to this MealService
     - VoucherStatus = ISSUED (not already COLLECTED)
     - Current time is within MealService startTime/endTime window
  -> If valid:
     -> MealVoucher.status = COLLECTED, collectedAt = now()
     -> Create MealCheckIn record
     -> Display: PASS "John Doe - Halal meal" (green confirmation)
  -> If already collected:
     -> Display: FAIL "Already collected at 12:34" (red warning)
     -> No record created
  -> If wrong meal service:
     -> Display: FAIL "This voucher is for Dinner, not Lunch" (amber warning)
  -> If expired (outside service window):
     -> Display: FAIL "Service ended at 14:00" (amber warning)
```

#### 5.3.3 Meal Forecasting Engine

```typescript
// src/logistics/catering/meal-forecasting.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

interface MealForecast {
  mealServiceId: string;
  mealType: string;
  date: Date;
  venue: string;
  forecast: {
    totalExpected: number;
    byDietary: Record<string, number>;
    withBuffer: {
      total: number;
      byDietary: Record<string, number>;
    };
  };
  confidence: number; // 0-1
  adjustments: string[]; // reasons for adjustment
}

@Injectable()
export class MealForecastingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Forecasts meal counts based on:
   * 1. Check-in data from Module 10 (who is actually on-site)
   * 2. Historical consumption patterns (what % actually eat)
   * 3. Dietary restriction aggregation from registration
   * 4. Time-of-day patterns (breakfast has lower turnout than lunch)
   */
  async forecastMealCounts(
    tenantId: string,
    eventId: string,
    targetDate: Date,
    bufferMultiplier: number = 1.1,
  ): Promise<MealForecast[]> {
    const mealPlans = await this.prisma.mealPlan.findMany({
      where: { tenantId, eventId, date: targetDate },
      include: { services: true },
    });

    const forecasts: MealForecast[] = [];

    for (const plan of mealPlans) {
      for (const service of plan.services) {
        const forecast = await this.forecastForService(
          tenantId,
          eventId,
          service,
          bufferMultiplier,
        );
        forecasts.push(forecast);
      }
    }

    return forecasts;
  }

  private async forecastForService(
    tenantId: string,
    eventId: string,
    service: any,
    bufferMultiplier: number,
  ): Promise<MealForecast> {
    // Get eligible participants (approved, checked-in for this date)
    const checkedInCount = await this.getCheckedInParticipantCount(eventId, service);

    // Get dietary breakdown
    const dietaryBreakdown = await this.getDietaryBreakdown(eventId, service);

    // Apply historical consumption rate
    const consumptionRate = this.getHistoricalConsumptionRate(service.mealType);
    const adjustedTotal = Math.ceil(checkedInCount * consumptionRate);

    // Apply buffer
    const bufferedDietary: Record<string, number> = {};
    for (const [type, count] of Object.entries(dietaryBreakdown)) {
      bufferedDietary[type] = Math.ceil((count as number) * consumptionRate * bufferMultiplier);
    }

    const adjustments: string[] = [];
    if (consumptionRate < 1) {
      adjustments.push(
        `Historical ${service.mealType} consumption rate: ${(consumptionRate * 100).toFixed(0)}%`,
      );
    }

    return {
      mealServiceId: service.id,
      mealType: service.mealType,
      date: service.startTime,
      venue: service.venue,
      forecast: {
        totalExpected: adjustedTotal,
        byDietary: dietaryBreakdown,
        withBuffer: {
          total: Math.ceil(adjustedTotal * bufferMultiplier),
          byDietary: bufferedDietary,
        },
      },
      confidence: checkedInCount > 0 ? 0.85 : 0.6,
      adjustments,
    };
  }

  /**
   * Historical consumption rates by meal type.
   * Based on typical diplomatic event patterns.
   */
  private getHistoricalConsumptionRate(mealType: string): number {
    const rates: Record<string, number> = {
      BREAKFAST: 0.75, // 75% of checked-in participants eat breakfast
      LUNCH: 0.92, // 92% eat lunch (main meal)
      DINNER: 0.8, // 80% attend dinner
      COFFEE_BREAK: 0.85, // 85% visit coffee breaks
      RECEPTION: 0.7, // 70% of invitees attend receptions
    };
    return rates[mealType] ?? 0.85;
  }

  /**
   * Waste reduction targeting: compare forecast vs actual consumption
   * to refine future forecasts.
   */
  async analyzeWaste(
    eventId: string,
    mealServiceId: string,
  ): Promise<{
    forecast: number;
    actual: number;
    wastePercent: number;
    recommendations: string[];
  }> {
    const service = await this.prisma.mealService.findUniqueOrThrow({
      where: { id: mealServiceId },
      include: { checkIns: true, vouchers: true },
    });

    const forecast = service.capacity ?? 0;
    const actual = service.checkIns.length;
    const wastePercent = forecast > 0 ? Math.round(((forecast - actual) / forecast) * 100) : 0;

    const recommendations: string[] = [];
    if (wastePercent > 20) {
      recommendations.push(`Reduce buffer for ${service.mealType} to 5% (was 10%)`);
    }
    if (wastePercent > 30) {
      recommendations.push(`Consider reducing capacity allocation by 15%`);
    }

    return { forecast, actual, wastePercent, recommendations };
  }

  private async getCheckedInParticipantCount(eventId: string, service: any): Promise<number> {
    // Query check-in records from Module 10 for participants on-site
    return 0; // placeholder
  }

  private async getDietaryBreakdown(
    eventId: string,
    service: any,
  ): Promise<Record<string, number>> {
    // Aggregate dietary preferences from participant custom data
    return { STANDARD: 0 }; // placeholder
  }
}
```

#### 5.3.4 VIP Dining & Guest List Management (Source)

Receptions and gala dinners use a curated guest list rather than participant-type rules. The guest list is managed separately: admin selects individual participants and assigns them table/seat numbers. The system generates personalized invitation vouchers with the table assignment printed on them.

VIP dining integrates with the Seating Management system for table layout and with the Communication Hub for sending formal dinner invitations.

#### 5.3.5 Catering Vendor Dashboard (Source)

A read-only portal accessible via a unique time-limited URL (no login required, link expires after event). Vendors see only what they need:

```
+--------------------------------------------------------------+
|  Catering Dashboard - Pinnacle Catering Co.                  |
|  38th AU Summit  |  Data refreshes every 5 minutes           |
+--------------------------------------------------------------+
|                                                               |
|  TODAY: Feb 10, 2026                                         |
|                                                               |
|  LUNCH (12:30 - 14:00) - Restaurant Level 2                 |
|  +------------------------------------------------------+    |
|  |  Total covers: 504 (with 10% buffer)                  |    |
|  |  Standard: 374 | Vegetarian: 50 | Halal: 25           |    |
|  |  Vegan: 20 | Kosher: 9 | GF: 14 | DF: 7 | NF: 5     |    |
|  +------------------------------------------------------+    |
|                                                               |
|  LIVE COLLECTION (updates in real-time):                     |
|  Collected: 287 / 455 expected  (63%)  =======---            |
|  Collection rate: ~12 per minute                              |
|  Estimated completion: 13:45                                  |
|                                                               |
|  UPCOMING:                                                    |
|  Coffee Break (15:30) - 800 covers                           |
|  Dinner Reception (19:00) - 312 covers                       |
|                                                               |
+--------------------------------------------------------------+
```

### 5.4 Parking Space Allocation

#### 5.4.1 Car Pass Design (Source)

Car passes are designed using the **badge designer** (same canvas, elements, dynamic text) with a different card size (A5 or custom). Dynamic fields include:

```json
{
  "elements": [
    {
      "type": "DYNAMIC_TEXT",
      "field": "parkingZone.name",
      "style": { "fontSize": 48, "fontWeight": "bold" }
    },
    { "type": "DYNAMIC_TEXT", "field": "permit.vehiclePlate", "style": { "fontSize": 36 } },
    { "type": "SHAPE", "fill": "parkingZone.color", "width": "100%", "height": 20 },
    { "type": "QR_CODE", "field": "permit.qrPayload", "size": 80 },
    { "type": "DYNAMIC_TEXT", "field": "permit.validFrom -> permit.validTo" },
    { "type": "TEXT", "content": "Display on dashboard at all times" }
  ]
}
```

#### 5.4.2 Gate Scanning Flow (Source)

```
Vehicle approaches gate -> Gate guard scans car pass QR
  -> System decodes QR -> finds ParkingPermit
  -> Checks:
    1. Permit status == ACTIVE? (not expired/revoked)
    2. Current time within validFrom-validTo?
    3. Current time within zone operatingHours?
    4. Zone occupancy < capacity?
  -> All pass: ALLOWED
    -> ParkingGateLog created (ENTRY)
    -> ParkingZone.occupancy += 1
    -> Gate opens (if automated)
  -> Any fail: DENIED with reason
    -> ParkingGateLog created (DENIED_FULL / DENIED_ACCESS / etc.)
    -> Guard sees reason on screen, directs to alternative zone

Vehicle exits -> Guard scans or auto-plate-reader detects
  -> ParkingGateLog created (EXIT)
  -> ParkingZone.occupancy -= 1
```

#### 5.4.3 Zone-Based Access Service

```typescript
// src/logistics/parking/parking-access.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { LocationCapacityService } from "../shared/location-capacity.service";

interface ParkingScanResult {
  result: "ALLOWED" | "DENIED_FULL" | "DENIED_ACCESS" | "DENIED_EXPIRED" | "DENIED_INVALID";
  permitNumber?: string;
  vehiclePlate?: string;
  zoneName: string;
  zoneOccupancy: number;
  zoneCapacity: number;
  message: string;
  alternativeZone?: string;
}

@Injectable()
export class ParkingAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly capacityService: LocationCapacityService,
  ) {}

  async processGateScan(
    qrPayload: string,
    zoneId: string,
    direction: "ENTRY" | "EXIT",
    scannedBy: string,
  ): Promise<ParkingScanResult> {
    const zone = await this.prisma.parkingZone.findUniqueOrThrow({
      where: { id: zoneId },
    });

    // EXIT is always allowed
    if (direction === "EXIT") {
      return this.processExit(zone, qrPayload, scannedBy);
    }

    // ENTRY: validate permit
    const permit = await this.prisma.parkingPermit.findFirst({
      where: { qrPayload },
    });

    if (!permit) {
      await this.logGateEvent(zoneId, null, qrPayload, "ENTRY", "DENIED_INVALID", scannedBy);
      return {
        result: "DENIED_INVALID",
        zoneName: zone.name,
        zoneOccupancy: zone.occupancy,
        zoneCapacity: zone.capacity,
        message: "Invalid parking permit",
      };
    }

    // Check permit status
    if (permit.status !== "ACTIVE") {
      await this.logGateEvent(
        zoneId,
        permit.id,
        permit.vehiclePlate,
        "ENTRY",
        "DENIED_EXPIRED",
        scannedBy,
      );
      return {
        result: "DENIED_EXPIRED",
        permitNumber: permit.permitNumber,
        vehiclePlate: permit.vehiclePlate,
        zoneName: zone.name,
        zoneOccupancy: zone.occupancy,
        zoneCapacity: zone.capacity,
        message: `Permit ${permit.permitNumber} is ${permit.status.toLowerCase()}`,
      };
    }

    // Check validity dates
    const now = new Date();
    if (now < permit.validFrom || now > permit.validTo) {
      await this.logGateEvent(
        zoneId,
        permit.id,
        permit.vehiclePlate,
        "ENTRY",
        "DENIED_EXPIRED",
        scannedBy,
      );
      return {
        result: "DENIED_EXPIRED",
        permitNumber: permit.permitNumber,
        vehiclePlate: permit.vehiclePlate,
        zoneName: zone.name,
        zoneOccupancy: zone.occupancy,
        zoneCapacity: zone.capacity,
        message: "Permit is outside valid date range",
      };
    }

    // Check zone capacity
    if (zone.occupancy >= zone.capacity) {
      const alternative = await this.findAlternativeZone(zone);
      await this.logGateEvent(
        zoneId,
        permit.id,
        permit.vehiclePlate,
        "ENTRY",
        "DENIED_FULL",
        scannedBy,
      );
      return {
        result: "DENIED_FULL",
        permitNumber: permit.permitNumber,
        vehiclePlate: permit.vehiclePlate,
        zoneName: zone.name,
        zoneOccupancy: zone.occupancy,
        zoneCapacity: zone.capacity,
        message: `${zone.name} is full (${zone.occupancy}/${zone.capacity})`,
        alternativeZone: alternative?.name,
      };
    }

    // Check zone access rules
    if (permit.parkingZoneId !== zoneId) {
      await this.logGateEvent(
        zoneId,
        permit.id,
        permit.vehiclePlate,
        "ENTRY",
        "DENIED_ACCESS",
        scannedBy,
      );
      return {
        result: "DENIED_ACCESS",
        permitNumber: permit.permitNumber,
        vehiclePlate: permit.vehiclePlate,
        zoneName: zone.name,
        zoneOccupancy: zone.occupancy,
        zoneCapacity: zone.capacity,
        message: `Permit is for zone "${permit.parkingZoneId}", not "${zone.name}"`,
      };
    }

    // All checks passed
    await this.prisma.parkingZone.update({
      where: { id: zoneId },
      data: { occupancy: { increment: 1 } },
    });
    await this.logGateEvent(zoneId, permit.id, permit.vehiclePlate, "ENTRY", "ALLOWED", scannedBy);

    return {
      result: "ALLOWED",
      permitNumber: permit.permitNumber,
      vehiclePlate: permit.vehiclePlate,
      zoneName: zone.name,
      zoneOccupancy: zone.occupancy + 1,
      zoneCapacity: zone.capacity,
      message: `Vehicle ${permit.vehiclePlate} admitted to ${zone.name}`,
    };
  }

  private async processExit(
    zone: any,
    qrPayload: string,
    scannedBy: string,
  ): Promise<ParkingScanResult> {
    await this.prisma.parkingZone.update({
      where: { id: zone.id },
      data: { occupancy: { decrement: 1 } },
    });
    await this.logGateEvent(zone.id, null, "", "EXIT", "ALLOWED", scannedBy);

    return {
      result: "ALLOWED",
      zoneName: zone.name,
      zoneOccupancy: Math.max(0, zone.occupancy - 1),
      zoneCapacity: zone.capacity,
      message: "Vehicle exit recorded",
    };
  }

  private async findAlternativeZone(currentZone: any): Promise<any | null> {
    return this.prisma.parkingZone.findFirst({
      where: {
        tenantId: currentZone.tenantId,
        eventId: currentZone.eventId,
        id: { not: currentZone.id },
        occupancy: { lt: this.prisma.parkingZone.fields.capacity },
      },
      orderBy: { occupancy: "asc" },
    });
  }

  private async logGateEvent(
    zoneId: string,
    permitId: string | null,
    vehiclePlate: string,
    direction: string,
    result: string,
    scannedBy: string,
  ): Promise<void> {
    await this.prisma.parkingGateLog.create({
      data: { parkingZoneId: zoneId, permitId, vehiclePlate, direction, result, scannedBy },
    });
  }
}
```

Auto-generate permits from participant registration data: when a participant of type "Driver" is approved with a vehicle plate number in their `customData`, the system can auto-create a `ParkingPermit` for the appropriate zone.

### 5.5 Interactive Floor Plan Editor

#### 5.5.1 Room Booking Calendar (Source)

```
Room Calendar - Feb 10, 2026                              [Day] [Week]

                  08:00   09:00   10:00   11:00   12:00   13:00   14:00
Plenary Hall     [Setup] |--- Opening Ceremony ---|Lunch |-- Plenary --
  (600 cap)                     CONFIRMED                    CONFIRMED

Conf Room A      [     ] |-- Committee on Peace --|Lunch |-- Committee
  (120 cap)                   CONFIRMED                    TENTATIVE !

Conf Room B      [     ] |-- Political Affairs ---|Lunch |-- Political
  (120 cap)                   CONFIRMED                    CONFIRMED

Bilateral 1      [     ] |Kenya-Ethiopia| |Nigeria-Ghana| |SA-Egypt|
  (20 cap)              09:00-10:00      10:30-11:30      14:00-15:00

Bilateral 2      [     ] |Tanzania-Rwanda| |Morocco-Tunisia|
  (20 cap)              09:00-10:00      10:30-11:30

Press Center     |------------ Open all day --------------------------
  (50 cap)                    CONFIRMED

[Setup/teardown buffer time]
! = Tentative booking (not yet confirmed)
```

**Conflict detection:** Before confirming a booking, the system checks:

1. No overlapping bookings for the same room (including setup/teardown buffers)
2. Expected attendees <= room capacity
3. Required equipment available in room (or flag what needs to be brought in)
4. If interpretation needed, verify booth is present in room

**Auto-generate setup tasks:** When a booking has `setupType` different from the room's default, or has `setupNotes`, the system creates a task in the staff task queue:

```
Setup Task: Conference Room A -> Hollow Square
  Due: Feb 10, 07:30 (30 min before 08:00 booking)
  Current setup: Theater
  Target setup: Hollow Square, 20 seats
  Notes: "4 country flags on stage, nameplates for 20"
  Equipment needed: Move 4 flag stands from storage
  Assigned to: Setup Team A
  Status: PENDING
```

#### 5.5.2 Floor Plan Editor Service

```typescript
// src/logistics/venue/floor-plan-editor.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { VenueRenderingEngine } from "./venue-rendering.engine";

interface FloorPlanElement {
  id: string;
  type: "ROOM" | "BOOTH" | "TABLE" | "ZONE" | "ANNOTATION" | "EQUIPMENT";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  color?: string;
  linkedRoomId?: string; // Link to Room model
  capacity?: number;
  equipment?: string[];
  metadata?: Record<string, any>;
}

interface FloorPlanUpdateRequest {
  elements: FloorPlanElement[];
  zones: Array<{
    id: string;
    name: string;
    type: string;
    polygon: [number, number][];
    color: string;
  }>;
}

@Injectable()
export class FloorPlanEditorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renderEngine: VenueRenderingEngine,
  ) {}

  /**
   * Updates the floor plan layout with drag-and-drop positioned elements.
   * Validates placement, syncs room positions, and updates zone overlays.
   */
  async updateFloorPlan(
    floorPlanId: string,
    update: FloorPlanUpdateRequest,
  ): Promise<{ success: boolean; errors: string[] }> {
    const floorPlan = await this.prisma.venueFloorPlan.findUniqueOrThrow({
      where: { id: floorPlanId },
    });

    // Validate element placement
    const validation = this.renderEngine.validatePlacement(
      update.elements,
      floorPlan.width ?? 1920,
      floorPlan.height ?? 1080,
    );

    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Update floor plan zones
    await this.prisma.venueFloorPlan.update({
      where: { id: floorPlanId },
      data: { zones: JSON.stringify(update.zones) },
    });

    // Sync room positions from elements
    for (const element of update.elements) {
      if (element.type === "ROOM" && element.linkedRoomId) {
        await this.prisma.room.update({
          where: { id: element.linkedRoomId },
          data: {
            positionX: element.x,
            positionY: element.y,
          },
        });
      }
    }

    return { success: true, errors: [] };
  }

  /**
   * Upload a floor plan image and create the database record.
   * Accepts PNG, JPG, or SVG. Maximum 20MB.
   */
  async uploadFloorPlanImage(
    venueId: string,
    name: string,
    floorNumber: number | null,
    imageUrl: string,
    width: number,
    height: number,
  ): Promise<string> {
    const floorPlan = await this.prisma.venueFloorPlan.create({
      data: {
        venueId,
        name,
        floorNumber,
        imageUrl,
        width,
        height,
        zones: JSON.stringify([]),
      },
    });

    return floorPlan.id;
  }

  /**
   * Place a room on the floor plan by creating an element link
   * between the Room model and a position on the floor plan image.
   */
  async placeRoomOnFloorPlan(
    roomId: string,
    floorPlanId: string,
    x: number,
    y: number,
  ): Promise<void> {
    await this.prisma.room.update({
      where: { id: roomId },
      data: {
        floorPlanId,
        positionX: x,
        positionY: y,
      },
    });
  }

  /**
   * Get all rooms positioned on a floor plan for rendering.
   */
  async getFloorPlanRooms(floorPlanId: string): Promise<
    Array<{
      roomId: string;
      name: string;
      code: string | null;
      capacity: number;
      setupType: string;
      positionX: number;
      positionY: number;
      currentBooking: any | null;
    }>
  > {
    const rooms = await this.prisma.room.findMany({
      where: { floorPlanId },
      include: {
        bookings: {
          where: {
            startTime: { lte: new Date() },
            endTime: { gte: new Date() },
            status: { not: "CANCELLED" },
          },
          take: 1,
        },
      },
    });

    return rooms.map((room) => ({
      roomId: room.id,
      name: room.name,
      code: room.code,
      capacity: room.capacity,
      setupType: room.setupType,
      positionX: room.positionX ?? 0,
      positionY: room.positionY ?? 0,
      currentBooking: room.bookings[0] ?? null,
    }));
  }
}
```

### 5.6 Multi-Venue Zone Coordination

#### 5.6.1 Zone Operations Dashboard (Source)

Each zone has a dedicated dashboard accessible to the zone manager and the central command center:

```
ZONE: CONFERENCE (Building A)                     Zone Manager: David M.
Status: OPERATIONAL      Occupancy: 485/600 (81%)     ================----

ROOMS STATUS                             ACTIVE STAFF
+------------------+------+----------+    +-----------------------------+
| Plenary Hall     | 480  | IN USE   |    | Ushers:     8/10 on duty   |
| Conf Room A      |  95  | IN USE   |    | Security:   4/4 on duty    |
| Conf Room B      |  80  | SETUP    |    | IT Support: 2/2 on duty    |
| Bilateral 1      |  12  | IN USE   |    | Protocol:   3/3 on duty    |
| Bilateral 2      |   0  | READY    |    | Medical:    1/1 on duty    |
| Bilateral 3      |   0  | READY    |    | Coverage gap: Usher Gate B |
| Press Center     |  32  | IN USE   |    |   12:00-13:00 (lunch)      |
+------------------+------+----------+    +-----------------------------+

NEXT 2 HOURS                             INCIDENTS
+-------------------------------------+  +----------------------------+
| 11:00 Committee on Peace (Room A)   |  | ! Projector issue Room B   |
| 11:00 Political Affairs (Room B)    |  |   Assigned: IT Support     |
| 11:30 Bilateral: Kenya-Ethiopia     |  |   Status: IN_PROGRESS      |
| 12:00 Lunch break (Catering Zone)   |  |                            |
| 13:00 Plenary resumes              |  | No other active incidents  |
+-------------------------------------+  +----------------------------+

SHUTTLES TO THIS ZONE
  Next arrival: 10:45 from Hotel Sheraton (12 passengers)
  Next arrival: 10:50 from Hotel Hilton (8 passengers)
```

#### 5.6.2 Inter-Zone Coordination Logic (Source)

When a participant's personal agenda includes sessions in different zones, the system:

1. Detects zone transitions needed between consecutive agenda items
2. Calculates travel time between zones
3. If walking distance: shows wayfinding directions in the participant app
4. If shuttle required: suggests next available shuttle and adds it to agenda
5. If insufficient transit time: warns participant ("You have 15 minutes between sessions in different buildings -- shuttle departs at 10:45, arrives 10:55, session starts 11:00")

When an incident in one zone requires resources from another:

```
Incident in VIP Zone (medical) -> Medical staff in VIP zone occupied
  -> System checks: Medical zone has available staff
  -> Auto-notification to Medical zone manager: "Medical support requested in VIP Zone"
  -> Medical zone dispatches staff
  -> Cross-zone incident log updated
  -> Command center sees unified view of all incident response
```

#### 5.6.3 Travel Time Matrix Service

```typescript
// src/logistics/zone/travel-time.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";

interface TravelTimeEntry {
  fromZoneId: string;
  toZoneId: string;
  walkingMinutes: number | null;
  shuttleMinutes: number | null;
  drivingMinutes: number | null;
}

@Injectable()
export class TravelTimeService {
  private readonly CACHE_KEY = "travel-time-matrix";

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Returns the full travel time matrix between all event zones.
   * Used for session scheduling validation and wayfinding.
   */
  async getMatrix(
    tenantId: string,
    eventId: string,
  ): Promise<{
    zones: Array<{ id: string; name: string; code: string }>;
    entries: TravelTimeEntry[];
  }> {
    const cacheKey = `${this.CACHE_KEY}:${tenantId}:${eventId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const zones = await this.prisma.eventZone.findMany({
      where: { tenantId, eventId },
      select: { id: true, name: true, code: true },
    });

    // Build matrix from stored travel times or calculate defaults
    const entries: TravelTimeEntry[] = [];
    for (const from of zones) {
      for (const to of zones) {
        if (from.id === to.id) continue;
        entries.push({
          fromZoneId: from.id,
          toZoneId: to.id,
          walkingMinutes: null, // configured by admin
          shuttleMinutes: null,
          drivingMinutes: null,
        });
      }
    }

    const result = { zones, entries };
    await this.redis.setex(cacheKey, 300, JSON.stringify(result));
    return result;
  }

  /**
   * Validates that a participant's agenda has sufficient travel time
   * between sessions in different zones.
   */
  async validateAgendaTransitions(
    tenantId: string,
    eventId: string,
    agendaItems: Array<{
      sessionId: string;
      zoneId: string;
      startTime: Date;
      endTime: Date;
    }>,
  ): Promise<
    Array<{
      fromSession: string;
      toSession: string;
      availableMinutes: number;
      requiredMinutes: number;
      sufficient: boolean;
      suggestion?: string;
    }>
  > {
    const matrix = await this.getMatrix(tenantId, eventId);
    const warnings: any[] = [];

    for (let i = 0; i < agendaItems.length - 1; i++) {
      const current = agendaItems[i];
      const next = agendaItems[i + 1];

      if (current.zoneId === next.zoneId) continue;

      const travelTime = matrix.entries.find(
        (e) => e.fromZoneId === current.zoneId && e.toZoneId === next.zoneId,
      );

      const availableMinutes = (next.startTime.getTime() - current.endTime.getTime()) / 60000;
      const requiredMinutes = travelTime?.walkingMinutes ?? travelTime?.shuttleMinutes ?? 15;

      warnings.push({
        fromSession: current.sessionId,
        toSession: next.sessionId,
        availableMinutes,
        requiredMinutes,
        sufficient: availableMinutes >= requiredMinutes,
        suggestion:
          availableMinutes < requiredMinutes
            ? `Consider shuttle: departs zone at ${current.endTime.toISOString()}`
            : undefined,
      });
    }

    return warnings;
  }

  /**
   * Find the next available shuttle between two zones.
   */
  async findNextShuttle(
    eventId: string,
    fromZoneId: string,
    toZoneId: string,
    afterTime: Date,
  ): Promise<any | null> {
    return this.prisma.interZoneShuttle.findFirst({
      where: {
        eventId,
        fromZoneId,
        toZoneId,
        departureTime: { gte: afterTime },
        status: "SCHEDULED",
      },
      orderBy: { departureTime: "asc" },
    });
  }
}
```

#### 5.6.4 Central Command Center Aggregation (Source)

The command center aggregates all zones into a unified view:

```
+- COMMAND CENTER -------------------------------------------------------+
|                                                                         |
|  ZONE STATUS MAP                        ALERT FEED                     |
|  +-----------------------------+       +-----------------------------+ |
|  |                             |       | 10:42 ! CONF: Room B proj- | |
|  |   [REG]  --shuttle--  [CONF]|       |        ector malfunction    | |
|  |   480/600    |        485/600|       | 10:38 * VIP: H.E. Ruto     | |
|  |              |              |       |        arrived, escorted    | |
|  |   [PARK]            [VIP]   |       | 10:35 ! PARK: P2 at 90%   | |
|  |   607/900    |       28/40  |       |        capacity             | |
|  |              |              |       | 10:30 * REG: Morning rush   | |
|  |   [PRESS]  --shuttle-- [CAT]|       |        complete, queue < 5  | |
|  |    32/50             210/400|       | 10:22 o MED: Minor first    | |
|  |                             |       |        aid, resolved         | |
|  +-----------------------------+       +-----------------------------+ |
|                                                                         |
|  OVERALL METRICS                        QUICK ACTIONS                  |
|  Participants on-site: 1,842           [Emergency Broadcast]           |
|  Staff on-duty: 156/180               [Pause All Sessions]            |
|  Active incidents: 1                   [Close All Gates]              |
|  Shuttles in transit: 3               [Activate Contingency]          |
|  Meals served today: 1,420/2,400                                      |
|                                                                         |
+------------------------------------------------------------------------+
```

### 5.7 Vendor Management Logic

```typescript
// src/logistics/vendor/vendor-management.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { randomBytes } from "crypto";

@Injectable()
export class VendorManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a time-limited portal access URL for a vendor.
   * The URL contains a signed token that grants read-only access to
   * the vendor's relevant logistics data without requiring login.
   */
  async generatePortalAccess(
    vendorId: string,
    expiresInDays: number = 30,
  ): Promise<{ url: string; expiresAt: Date }> {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const portalUrl = `${process.env.APP_URL}/vendor-portal/${token}`;

    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        portalAccessUrl: portalUrl,
        portalExpiresAt: expiresAt,
      },
    });

    return { url: portalUrl, expiresAt };
  }

  /**
   * Track vendor SLA compliance.
   * Monitors delivery deadlines, quality metrics, and responsiveness.
   */
  async checkSlaCompliance(
    vendorId: string,
    eventId: string,
  ): Promise<{
    overallCompliance: number; // 0-100 percentage
    metrics: Array<{
      metric: string;
      target: number;
      actual: number;
      compliant: boolean;
    }>;
    alerts: string[];
  }> {
    const contract = await this.prisma.vendorContract.findFirst({
      where: { vendorId, eventId, status: "ACTIVE" },
    });

    if (!contract) {
      return { overallCompliance: 0, metrics: [], alerts: ["No active contract found"] };
    }

    const performanceLogs = await this.prisma.vendorPerformanceLog.findMany({
      where: { vendorId, eventId },
    });

    const slaTerms = contract.slaTerms as any;
    const metrics: Array<{ metric: string; target: number; actual: number; compliant: boolean }> =
      [];
    const alerts: string[] = [];

    // Calculate average scores per metric
    const metricGroups = new Map<string, number[]>();
    for (const log of performanceLogs) {
      if (!metricGroups.has(log.metric)) metricGroups.set(log.metric, []);
      metricGroups.get(log.metric)!.push(log.score);
    }

    for (const [metric, scores] of metricGroups) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const target = slaTerms?.[metric]?.target ?? 4.0;
      const compliant = avgScore >= target;
      metrics.push({ metric, target, actual: Math.round(avgScore * 100) / 100, compliant });
      if (!compliant) {
        alerts.push(`${metric}: average score ${avgScore.toFixed(1)} below target ${target}`);
      }
    }

    const compliantCount = metrics.filter((m) => m.compliant).length;
    const overallCompliance =
      metrics.length > 0 ? Math.round((compliantCount / metrics.length) * 100) : 100;

    return { overallCompliance, metrics, alerts };
  }

  /**
   * Reconcile vendor invoices against contract deliverables.
   */
  async reconcileInvoices(
    vendorId: string,
    eventId: string,
  ): Promise<{
    contractValue: number;
    totalInvoiced: number;
    totalPaid: number;
    totalPending: number;
    remainingBudget: number;
    overBudget: boolean;
  }> {
    const contract = await this.prisma.vendorContract.findFirst({
      where: { vendorId, eventId, status: "ACTIVE" },
    });

    const invoices = await this.prisma.vendorInvoice.findMany({
      where: { vendorId, contract: { eventId } },
    });

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.amount, 0);
    const totalPending = invoices
      .filter((inv) => inv.status === "PENDING" || inv.status === "APPROVED")
      .reduce((sum, inv) => sum + inv.amount, 0);

    const contractValue = contract?.totalValue ?? 0;

    return {
      contractValue,
      totalInvoiced,
      totalPaid,
      totalPending,
      remainingBudget: contractValue - totalInvoiced,
      overBudget: totalInvoiced > contractValue,
    };
  }
}
```

### 5.8 Capacity Planning Engine

The capacity planning engine aggregates demand forecasting across all logistics domains and produces resource allocation recommendations.

```typescript
// src/logistics/shared/capacity-report.service.ts

import { Injectable } from "@nestjs/common";
import { CapacityPlanningEngine } from "./capacity-planning.engine";
import { PrismaService } from "@/prisma/prisma.service";

interface CapacityReport {
  generatedAt: Date;
  eventId: string;
  summary: {
    totalParticipantsExpected: number;
    totalRoomsAllocated: number;
    totalVehicles: number;
    totalMealCovers: number;
    totalParkingSpaces: number;
  };
  domainStatus: Array<{
    domain: string;
    status: "GREEN" | "AMBER" | "RED";
    message: string;
    recommendations: string[];
  }>;
  timeline: Array<{
    date: Date;
    peakDemand: Record<string, number>;
    allocatedCapacity: Record<string, number>;
  }>;
}

@Injectable()
export class CapacityReportService {
  constructor(
    private readonly engine: CapacityPlanningEngine,
    private readonly prisma: PrismaService,
  ) {}

  async generateReport(tenantId: string, eventId: string): Promise<CapacityReport> {
    const allocations = await this.engine.optimizeResourceAllocation(tenantId, eventId);

    const domainStatus = allocations.map((a) => ({
      domain: a.domain,
      status: (a.status === "ADEQUATE" ? "GREEN" : a.status === "TIGHT" ? "AMBER" : "RED") as
        | "GREEN"
        | "AMBER"
        | "RED",
      message: `${a.resource}: ${a.allocated} allocated, ${a.required} required (surplus: ${a.surplus})`,
      recommendations:
        a.status === "DEFICIT"
          ? [`Increase ${a.resource} allocation by at least ${Math.abs(a.surplus)}`]
          : a.status === "TIGHT"
            ? [
                `Monitor ${a.resource} closely; consider adding ${Math.ceil(a.allocated * 0.1)} buffer`,
              ]
            : [],
    }));

    return {
      generatedAt: new Date(),
      eventId,
      summary: {
        totalParticipantsExpected: 0, // aggregated
        totalRoomsAllocated: allocations.find((a) => a.domain === "ACCOMMODATION")?.allocated ?? 0,
        totalVehicles: allocations.find((a) => a.domain === "TRANSPORT")?.allocated ?? 0,
        totalMealCovers: allocations.find((a) => a.domain === "CATERING")?.allocated ?? 0,
        totalParkingSpaces: allocations.find((a) => a.domain === "PARKING")?.allocated ?? 0,
      },
      domainStatus,
      timeline: [], // generated from date-specific forecasts
    };
  }
}
```

### 5.9 Integration Points (Source Tables)

#### Accommodation Integration

| System               | Integration                                                                      |
| -------------------- | -------------------------------------------------------------------------------- |
| Participant Approval | Auto-assign room when participant reaches APPROVED status                        |
| Delegation Portal    | Focal points view room assignments for their delegation                          |
| Transport            | Hotel address used as pickup/dropoff location for airport transfers              |
| Protocol             | Protocol rank determines room type assignment                                    |
| Budget               | Room costs aggregated per delegation for billing                                 |
| Waitlist             | When participant is rejected/cancelled, room released for waitlisted participant |
| Personal Agenda      | Room details shown on participant's agenda                                       |
| Command Center       | Hotel occupancy feeds into operational dashboard                                 |

#### Transportation Integration

| System                   | Integration                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| Participant Registration | Flight data captured during registration creates transport requests |
| Accommodation            | Hotel address used as default pickup/dropoff for hotel transfers    |
| Bilateral Meetings       | Inter-venue bilateral meetings trigger transport requests           |
| Personal Agenda          | Transport details shown on participant's mobile agenda              |
| Command Center           | Vehicle locations and status stream via SSE                         |
| Budget                   | Vehicle hire and fuel costs tracked per delegation                  |
| Incident Management      | Vehicle breakdown creates incident                                  |
| Check-In                 | Arrival scan at venue confirms transport completion                 |

#### Catering Integration

| System                        | Integration                                                                |
| ----------------------------- | -------------------------------------------------------------------------- |
| **Participant registration**  | Dietary preference captured as custom field flows into voucher generation  |
| **Badge QR**                  | Same QR code on badge can serve as meal voucher (no separate print needed) |
| **Check-In / Access Control** | Meal scanning stations use same scanner infrastructure                     |
| **Seating Management**        | VIP dinner guest list references seat assignments                          |
| **Communication Hub**         | Meal reminders, VIP dinner invitations, dietary confirmation requests      |
| **Command Center**            | Live collection rate widget, catering alert feed                           |
| **Staff Management**          | Catering staff shifts aligned with meal service windows                    |

---

## 6. User Interface

### 6.1 Accommodation Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Accommodation Dashboard                 [Add Hotel] [Export]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Hotel Summary                                                   │
│  ┌─────────────────────┬──────┬──────┬───────┬────────┬───────┐ │
│  │ Hotel               │Rooms │Assign│ Check │No-Show │Avail  │ │
│  ├─────────────────────┼──────┼──────┼───────┼────────┼───────┤ │
│  │ Sheraton Addis ★★★★★│  120 │  98  │  72   │   3    │  22   │ │
│  │ Hilton Addis   ★★★★★│   80 │  74  │  65   │   1    │   6   │ │
│  │ Hyatt Regency  ★★★★ │  150 │ 112  │  89   │   5    │  38   │ │
│  │ Capital Hotel  ★★★  │  200 │ 145  │  98   │   8    │  55   │ │
│  └─────────────────────┴──────┴──────┴───────┴────────┴───────┘ │
│                                                                  │
│  Room Type Distribution          Assignment Alerts               │
│  Presidential ██░░  4/5          ⚠ 23 approved participants     │
│  Suite        ████░ 18/22          unassigned                    │
│  Executive    ██████ 67/80       ⚠ 8 no-shows — rooms held     │
│  Double       ████████ 198/250   ⚠ Sheraton at 82% capacity    │
│  Single       ████████░ 142/193                                  │
│                                                                  │
│  [Auto-Assign Unassigned]  [Generate Rooming Lists]             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Room Grid Detail View:** Clicking a hotel row expands to show a color-coded room grid:

```
┌─────────────────────────────────────────────────────────────────┐
│  Sheraton Addis Ababa ★★★★★                     [Edit] [Export] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Floor 12 (Presidential)                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │ 1201 │ │ 1202 │ │ 1203 │ │ 1204 │ │ 1205 │                  │
│  │ ████ │ │ ████ │ │ ░░░░ │ │ ████ │ │ ░░░░ │                  │
│  │ KEN  │ │ KEN  │ │ avail│ │ NGA  │ │ avail│                  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                  │
│                                                                  │
│  Floor 8 (Suites)                                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 801  │ │ 802  │ │ 803  │ │ 804  │ │ 805  │ │ 806  │        │
│  │ ████ │ │ ████ │ │ ████ │ │ ▓▓▓▓ │ │ ░░░░ │ │ ████ │        │
│  │ ETH  │ │ KEN  │ │ TZA  │ │ late │ │ avail│ │ GHA  │        │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘        │
│                                                                  │
│  Legend: ████ Occupied  ▓▓▓▓ Late arrival  ░░░░ Available       │
│          ▒▒▒▒ No-show   ░▒░▒ Maintenance                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Transport Schedule Board

Gantt-style transport schedule view showing all transport activities across a timeline:

```
┌─────────────────────────────────────────────────────────────────┐
│  Transportation Dashboard — Live               [Add Vehicle]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Fleet Status                    Today's Schedule                │
│  Available:  12 ████████████     ┌──────────────────────────┐   │
│  In Use:      8 ████████         │ 14:00  ET502 pickup ●    │   │
│  Assigned:    5 █████            │ 14:15  Shuttle Run 12    │   │
│  Maintenance: 2 ██               │ 14:30  ET714 pickup ●    │   │
│                                  │ 14:30  Bilateral transfer│   │
│  Upcoming Pickups (next 2 hrs)   │ 15:00  Shuttle Run 13    │   │
│  ┌────────┬──────────┬────────┐  │ 15:15  Motorcade prep ★  │   │
│  │ Time   │ Flight   │ Status │  │ 15:30  ET819 pickup ●    │   │
│  │ 14:00  │ ET502    │ ● Asgn│  │ ...                      │   │
│  │ 14:30  │ ET714    │ ○ Pend│  └──────────────────────────┘   │
│  │ 15:30  │ ET819    │ ● Asgn│                                  │
│  │ 16:00  │ KQ402    │ ✗ No  │  Shuttle Routes                  │
│  │        │          │ Driver│  Hotel Zone → Venue: every 15m  │
│  └────────┴──────────┴────────┘  Airport Express: every 30m     │
│                                  VIP Shuttle: on demand          │
│  ⚠ KQ402 (16:00) has no vehicle — 3 passengers arriving        │
│  [Auto-Assign]                                                   │
│                                                                  │
│  GANTT VIEW                                                      │
│  Vehicle    06:00  08:00  10:00  12:00  14:00  16:00  18:00     │
│  LC-001     ░░░░░░░░░░░░├──ET502──┤░░░├Motorcade┤░░░░░░░░░     │
│  SD-005     ░░░░░░├─Shuttle─┤░░░░├ET714┤░░░░░░░░░░░░░░░░░      │
│  BUS-002    ├─Shuttle─┤├─Shuttle─┤├─Shuttle─┤├─Shuttle─┤░░░     │
│  VAN-003    ░░░░░░░░░░├─Airport─┤░░░░├─Airport─┤░░░░░░░░░      │
│  ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Catering Service Point Interface

Mobile/tablet interface for meal scanning stations:

```
┌─────────────────────────────────────────────┐
│  Meal Check-In Scanner          Feb 10      │
│  Service: LUNCH (12:30-14:00)               │
│  Venue: Restaurant Level 2                  │
├─────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │        [Camera Viewfinder]          │    │
│  │                                     │    │
│  │       Point camera at QR code       │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  Last Scan:                                  │
│  ┌─────────────────────────────────────┐    │
│  │  ✓ PASS                             │    │
│  │  John Doe — HALAL meal              │    │
│  │  Scanned at 12:47:32               │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  Session Stats:                              │
│  Collected:  287 / 455  (63%)               │
│  ████████████████████░░░░░░░░░░             │
│  Rate: ~12/min | Est. done: 13:45           │
│                                              │
│  By Dietary:                                 │
│  STD: 220/340 | VEG: 32/45 | HAL: 18/22    │
│  VGN: 10/18  | KOS: 5/8   | GF: 2/12      │
│                                              │
│  [Manual Entry]  [View Denied]              │
└─────────────────────────────────────────────┘
```

### 6.4 Parking Management Map

Real-time zone availability map with visual occupancy indicators:

```
┌─────────────────────────────────────────────────────────────────┐
│  Parking Management — Real-time                [Add Zone]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    VENUE MAP                             │    │
│  │                                                          │    │
│  │     ┌──────────┐                                        │    │
│  │     │  PVIP    │  ┌─────────────────────────────┐       │    │
│  │     │  42/50   │  │        MAIN VENUE           │       │    │
│  │     │  84% ▓▓▓ │  │                             │       │    │
│  │     └──────────┘  │                             │       │    │
│  │                    │                             │       │    │
│  │     ┌──────────┐  └─────────────────────────────┘       │    │
│  │     │   P1     │                                        │    │
│  │     │ 180/300  │  ┌──────────┐  ┌──────────┐           │    │
│  │     │  60% ░░░ │  │   PM     │  │   PS     │           │    │
│  │     └──────────┘  │  35/50   │  │  80/200  │           │    │
│  │                    │  70% ▓▓░ │  │  40% ░░░ │           │    │
│  │     ┌──────────┐  └──────────┘  └──────────┘           │    │
│  │     │   P2     │                                        │    │
│  │     │ 270/300  │                                        │    │
│  │     │  90% ▓▓▓ │ ⚠ ALERT                              │    │
│  │     └──────────┘                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Parking Zones - Real-time Occupancy                             │
│                                                                  │
│  VIP (PVIP)     ████████████████░░░░  42/50  (84%)              │
│  Delegate (P1)  ████████████░░░░░░░░  180/300 (60%)             │
│  Delegate (P2)  ██████████████████░░  270/300 (90%) ⚠           │
│  Staff (PS)     ████████░░░░░░░░░░░░  80/200  (40%)             │
│  Media (PM)     ██████████████░░░░░░  35/50   (70%)             │
│                                                                  │
│  Total vehicles on-site: 607 / 900                               │
│                                                                  │
│  ⚠ P2 at 90% - consider routing overflow to P1                 │
│                                                                  │
│  [Issue Permit]  [View Gate Logs]  [Print Car Passes]           │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5 Interactive Venue Floor Plan Editor

```
┌─────────────────────────────────────────────────────────────────┐
│  Floor Plan Editor — Conference Centre, Level 2   [Save] [Undo] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌────────────────────────────────────────────┐   │
│  │ TOOLBOX  │  │                                            │   │
│  │          │  │      [Floor Plan Image Canvas]             │   │
│  │ □ Room   │  │                                            │   │
│  │ ◇ Booth  │  │  ┌──────────────────────┐                 │   │
│  │ ○ Table  │  │  │    Plenary Hall      │   ┌─────────┐   │   │
│  │ ▧ Zone   │  │  │    Cap: 600          │   │ Conf A  │   │   │
│  │ ↗ Arrow  │  │  │    HOLLOW_SQUARE     │   │ Cap:120 │   │   │
│  │ T Text   │  │  │    [IN USE]          │   │[SETUP]  │   │   │
│  │ ⚡ Equip │  │  └──────────────────────┘   └─────────┘   │   │
│  │          │  │                                            │   │
│  │ LAYERS   │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│  │ ☑ Rooms  │  │  │Bilat. 1 │ │Bilat. 2 │ │Bilat. 3 │     │   │
│  │ ☑ Zones  │  │  │Cap: 20  │ │Cap: 20  │ │Cap: 20  │     │   │
│  │ ☑ Equip  │  │  │[IN USE] │ │[READY]  │ │[READY]  │     │   │
│  │ ☐ Grid   │  │  └─────────┘ └─────────┘ └─────────┘     │   │
│  │          │  │                              ┌──────────┐  │   │
│  │ PROPS    │  │                              │Press Ctr │  │   │
│  │ Name: .. │  │                              │Cap: 50   │  │   │
│  │ Cap: ... │  │                              │[IN USE]  │  │   │
│  │ Setup: . │  │                              └──────────┘  │   │
│  │ Color: . │  │                                            │   │
│  └──────────┘  └────────────────────────────────────────────┘   │
│                                                                  │
│  Room Calendar - Feb 10, 2026              [Day] [Week]          │
│                 08:00  09:00  10:00  11:00  12:00  13:00  14:00 │
│  Plenary Hall  [Stp] |-- Opening Ceremony --|Lunch|-- Plenary -- │
│  Conf Room A   [   ] |-- Committee Peace ---|Lunch|-- Committee  │
│  Bilateral 1   [   ] |Kenya-Ethiopia| |Nigeria-Ghana| |SA-Egypt| │
│  Press Center  |------------ Open all day ----------------------- │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.6 Multi-Venue Overview Map

```
┌─────────────────────────────────────────────────────────────────┐
│  Multi-Venue Overview — 38th AU Summit       [Zones] [Shuttles] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │   ┌─────────────────┐    Shuttle (15 min)               │    │
│  │   │  CONFERENCE      │◄═══════════════►┌──────────────┐ │    │
│  │   │  CENTRE          │                 │ HOTEL ZONE   │ │    │
│  │   │  ┌────┐ ┌────┐  │                 │              │ │    │
│  │   │  │CONF│ │VIP │  │                 │ ★ Sheraton   │ │    │
│  │   │  │485 │ │ 28 │  │                 │ ★ Hilton     │ │    │
│  │   │  │/600│ │/40 │  │                 │ ★ Hyatt      │ │    │
│  │   │  └────┘ └────┘  │                 │ ★ Capital    │ │    │
│  │   │  ┌────┐ ┌────┐  │                 └──────────────┘ │    │
│  │   │  │REG │ │CAT │  │                                  │    │
│  │   │  │480 │ │210 │  │    Shuttle (25 min)              │    │
│  │   │  │/600│ │/400│  │◄═══════════════►┌──────────────┐ │    │
│  │   │  └────┘ └────┘  │                 │ AIRPORT      │ │    │
│  │   └─────────────────┘                 │ Bole Intl    │ │    │
│  │                                        └──────────────┘ │    │
│  │   ┌────┐   ┌────┐                                      │    │
│  │   │PARK│   │PRSS│                                       │    │
│  │   │607 │   │ 32 │   Shuttles in Transit: 3             │    │
│  │   │/900│   │/50 │   Next departure: 10:45 → Hotel     │    │
│  │   └────┘   └────┘                                      │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Zone Status Summary:                                            │
│  CONF ● 81%  |  VIP ● 70%  |  REG ● 80%  |  CAT ○ 53%         │
│  PARK ○ 67%  |  PRESS ○ 64% |  MED ○ 10%  |  SEC ● 75%         │
│                                                                  │
│  ● = >70% occupancy   ○ = <70% occupancy                       │
└─────────────────────────────────────────────────────────────────┘
```

### 6.7 Vendor Management Console

```
┌─────────────────────────────────────────────────────────────────┐
│  Vendor Management                    [Add Vendor] [Reports]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Active Vendors                                                  │
│  ┌────────────────────┬──────────┬────────┬───────┬──────────┐  │
│  │ Vendor             │ Category │ Status │ SLA   │ Contract │  │
│  ├────────────────────┼──────────┼────────┼───────┼──────────┤  │
│  │ Pinnacle Catering  │ Catering │ Active │ 92%   │ $145,000 │  │
│  │ Eagle Transport    │ Transport│ Active │ 88%   │  $78,000 │  │
│  │ SafeGuard Security │ Security │ Active │ 95%   │  $62,000 │  │
│  │ SignPro Graphics   │ Signage  │ Active │ 100%  │  $18,500 │  │
│  │ TechAV Solutions   │ AV Equip │ Active │ 85%   │  $34,000 │  │
│  └────────────────────┴──────────┴────────┴───────┴──────────┘  │
│                                                                  │
│  Invoice Summary                   Performance Overview          │
│  Total contracted: $337,500        Average SLA: 92%              │
│  Total invoiced:   $215,800        ┌───────────────────────┐    │
│  Total paid:       $148,200        │ Delivery    ████░ 4.2 │    │
│  Pending approval:  $45,600        │ Quality     █████ 4.6 │    │
│  Remaining budget: $121,700        │ Response    ████░ 4.0 │    │
│                                    │ Value       ████░ 4.3 │    │
│  ⚠ Eagle Transport: SLA at 88%   └───────────────────────┘    │
│    - 2 late pickups this week                                    │
│    - Review scheduled for Feb 12                                 │
│                                                                  │
│  [Generate Portal Links]  [Export Invoice Report]               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Integration Points

### 7.1 Registration Data for Logistics Planning

**Source:** Module 09 (Registration & Accreditation)
**Direction:** Module 09 --> Module 11

When a participant completes registration and reaches APPROVED status, the following data flows into the logistics module:

```typescript
// Event: participant.approved
interface ParticipantApprovedEvent {
  participantId: string;
  eventId: string;
  tenantId: string;
  participantType: string;
  protocolRank: string;
  delegationId: string;
  customData: {
    dietary_preference?: string;
    flight_number?: string;
    flight_arrival_time?: string;
    flight_departure_time?: string;
    terminal?: string;
    vehicle_plate?: string;
    accessibility_needs?: string;
    hotel_preference?: string;
  };
}

// Triggers in Module 11:
// 1. Room auto-assignment (Accommodation)
// 2. Transport request creation (if flight data present)
// 3. Meal voucher generation (if meal plan exists for dates)
// 4. Parking permit issuance (if vehicle plate present)
```

### 7.2 Check-In Data for Meal Counts

**Source:** Module 10 (Event Operations Center)
**Direction:** Module 10 --> Module 11

Real-time check-in data from venue access scanners feeds into meal count forecasting:

```typescript
// Event: participant.checked_in
interface ParticipantCheckedInEvent {
  participantId: string;
  eventId: string;
  zoneId: string;
  scannedAt: string;
}

// Module 11 uses this to:
// 1. Adjust meal forecasts based on who is actually on-site
// 2. Activate meal vouchers for checked-in participants
// 3. Update zone occupancy in real-time
// 4. Trigger transport completion confirmation
```

### 7.3 Protocol Requirements for VIP Logistics

**Source:** Module 12 (Protocol & Diplomacy)
**Direction:** Module 12 --> Module 11

Protocol requirements drive logistics decisions for VIP participants:

```typescript
// Event: protocol.requirements_updated
interface ProtocolRequirementsEvent {
  participantId: string;
  protocolRank: string;
  securityLevel: string;
  motorcadeRequired: boolean;
  suiteRequired: boolean;
  dedicatedVehicle: boolean;
  securityDetail: number; // number of security personnel
  dietaryNotes: string;
}

// Module 11 uses this to:
// 1. Assign presidential suites (Accommodation)
// 2. Schedule motorcades with escort vehicles (Transport)
// 3. Reserve VIP dining tables (Catering)
// 4. Assign VIP parking zones (Parking)
// 5. Configure VIP zone access (Zones)
```

### 7.4 Workforce Deployment for Logistics Staff

**Source:** Module 13 (People & Workforce)
**Direction:** Module 11 <--> Module 13

Bidirectional integration for logistics staff management:

```typescript
// Module 11 --> Module 13: Staff requirements
interface StaffRequirementEvent {
  domain: "ACCOMMODATION" | "TRANSPORT" | "CATERING" | "PARKING" | "VENUE" | "ZONE";
  zoneId?: string;
  role: string; // "DRIVER", "PARKING_ATTENDANT", "CATERING_STAFF", "USHER"
  requiredCount: number;
  shift: { start: string; end: string };
  location: string;
}

// Module 13 --> Module 11: Staff assignments
interface StaffAssignedEvent {
  staffMemberId: string;
  assignedDomain: string;
  assignedZoneId?: string;
  role: string;
  shiftStart: string;
  shiftEnd: string;
}
```

### 7.5 Communication for Logistics Notifications

**Source:** Module 14 (Communication Hub)
**Direction:** Module 11 --> Module 14

The logistics module triggers notifications across multiple channels:

| Trigger               | Recipient      | Channel          | Content                                          |
| --------------------- | -------------- | ---------------- | ------------------------------------------------ |
| Room assigned         | Participant    | Email            | Hotel name, room type, check-in instructions     |
| Transport scheduled   | Participant    | Email + SMS      | Driver details, vehicle info, pickup time        |
| Transport scheduled   | Driver         | SMS + Push       | Passenger name, flight, terminal, time           |
| Meal voucher issued   | Participant    | Email            | QR code, meal schedule, dietary confirmation     |
| Parking permit issued | Participant    | Email            | Car pass PDF, zone assignment, operating hours   |
| Zone capacity alert   | Zone Manager   | Push             | Zone name, occupancy percentage, action needed   |
| Vehicle delay         | Operations     | Push + Dashboard | Vehicle ID, delay duration, affected passengers  |
| Shuttle departure     | Zone occupants | Push             | Shuttle route, departure time, boarding location |

### 7.6 Cross-Domain Integration Matrix

```
              ┌─────┬─────┬─────┬─────┬─────┬─────┐
              │Accom│Trans│Cater│Park │Venue│Zones│
         ┌────┼─────┼─────┼─────┼─────┼─────┼─────┤
         │Accom│  -  │ ←→  │     │     │     │     │
         ├────┼─────┼─────┼─────┼─────┼─────┼─────┤
         │Trans│ ←→  │  -  │     │     │  ←  │ ←→  │
         ├────┼─────┼─────┼─────┼─────┼─────┼─────┤
         │Cater│     │     │  -  │     │  ←  │ ←→  │
         ├────┼─────┼─────┼─────┼─────┼─────┼─────┤
         │Park │     │     │     │  -  │     │ ←→  │
         ├────┼─────┼─────┼─────┼─────┼─────┼─────┤
         │Venue│     │  →  │  →  │     │  -  │ ←→  │
         ├────┼─────┼─────┼─────┼─────┼─────┼─────┤
         │Zones│     │ ←→  │ ←→  │ ←→  │ ←→  │  -  │
         └────┴─────┴─────┴─────┴─────┴─────┴─────┘

  ←→ = Bidirectional data flow
  ←  = Receives data from
  →  = Sends data to

  Key flows:
  - Accommodation ←→ Transport: Hotel addresses as pickup/dropoff locations
  - Transport ←→ Zones: Shuttle scheduling between zones
  - Catering ←→ Zones: Meal service point locations within zones
  - Venue → Transport: Venue locations for route planning
  - Venue → Catering: Venue catering facilities for service points
  - Zones ←→ All: Zone occupancy affects all domains
```

---

## 8. Configuration

### 8.1 Feature Flags per Logistics Domain

```typescript
// Feature flags controlling which logistics domains are enabled per tenant
interface LogisticsFeatureFlags {
  // Domain-level toggles
  "logistics.accommodation.enabled": boolean;
  "logistics.transport.enabled": boolean;
  "logistics.catering.enabled": boolean;
  "logistics.parking.enabled": boolean;
  "logistics.venue.enabled": boolean;
  "logistics.zones.enabled": boolean;
  "logistics.vendor.enabled": boolean;

  // Feature-level toggles
  "logistics.accommodation.auto_assign": boolean;
  "logistics.accommodation.overbooking": boolean;
  "logistics.transport.gps_tracking": boolean;
  "logistics.transport.auto_schedule": boolean;
  "logistics.transport.motorcade_support": boolean;
  "logistics.catering.qr_scanning": boolean;
  "logistics.catering.vendor_portal": boolean;
  "logistics.catering.waste_tracking": boolean;
  "logistics.parking.auto_permits": boolean;
  "logistics.parking.sensor_integration": boolean;
  "logistics.venue.floor_plan_editor": boolean;
  "logistics.venue.3d_visualization": boolean;
  "logistics.zones.inter_zone_shuttles": boolean;
  "logistics.zones.real_time_occupancy": boolean;
}
```

### 8.2 Capacity Thresholds

```typescript
interface CapacityThresholdConfig {
  accommodation: {
    warningPercent: number; // Default: 80
    criticalPercent: number; // Default: 95
    overbookingPercent: number; // Default: 8 (based on no-show rate)
    maxOverbookingPercent: number; // Default: 15 (hard cap)
  };
  parking: {
    warningPercent: number; // Default: 80
    criticalPercent: number; // Default: 90
    overflowAutoRedirect: boolean; // Default: true
  };
  zones: {
    warningPercent: number; // Default: 75
    criticalPercent: number; // Default: 90
    autoCloseAtPercent: number; // Default: 100
  };
  catering: {
    bufferMultiplier: number; // Default: 1.10 (10% overage)
    maxBufferMultiplier: number; // Default: 1.25
    wasteAlertPercent: number; // Default: 20 (alert if >20% waste)
  };
}
```

### 8.3 Meal Service Windows

```typescript
interface MealServiceWindowConfig {
  defaultWindows: {
    BREAKFAST: { start: "07:00"; end: "09:00" };
    LUNCH: { start: "12:00"; end: "14:00" };
    DINNER: { start: "19:00"; end: "21:00" };
    COFFEE_BREAK: { start: "10:30"; end: "11:00" };
    RECEPTION: { start: "19:00"; end: "22:00" };
  };
  lateCollectionGraceMinutes: number; // Default: 15
  earlyCollectionGraceMinutes: number; // Default: 10
  autoExpireVouchers: boolean; // Default: true
  requireStationSelection: boolean; // Default: true
}
```

### 8.4 Parking Zone Definitions

```typescript
interface ParkingZoneConfig {
  defaultZones: Array<{
    code: string;
    name: string;
    color: string;
    participantTypes: string[];
  }>;
  operatingHours: {
    defaultOpen: string; // "06:00"
    defaultClose: string; // "22:00"
  };
  gateScanning: {
    autoGateEnabled: boolean; // Default: false
    plateReaderEnabled: boolean; // Default: false
    manualOverrideAllowed: boolean; // Default: true
  };
  permitDesign: {
    defaultSize: "A5" | "A6" | "CUSTOM";
    includeQrCode: boolean; // Default: true
    includeZoneColor: boolean; // Default: true
  };
}
```

### 8.5 Floor Plan Upload Limits

```typescript
interface FloorPlanUploadConfig {
  maxFileSizeMb: number; // Default: 20
  allowedFormats: string[]; // Default: ['png', 'jpg', 'jpeg', 'svg']
  maxImageWidth: number; // Default: 8000 pixels
  maxImageHeight: number; // Default: 8000 pixels
  maxFloorPlansPerVenue: number; // Default: 20
  maxRoomsPerFloorPlan: number; // Default: 100
  maxZonesPerFloorPlan: number; // Default: 50
  storageProvider: "AZURE_BLOB" | "S3" | "LOCAL";
  thumbnailGeneration: boolean; // Default: true
  thumbnailMaxWidth: number; // Default: 400
}
```

### 8.6 Shuttle Scheduling Parameters

```typescript
interface ShuttleSchedulingConfig {
  defaultFrequencyMinutes: number; // Default: 15
  minFrequencyMinutes: number; // Default: 5
  maxFrequencyMinutes: number; // Default: 60
  defaultCapacity: number; // Default: 20
  boardingTimeMinutes: number; // Default: 5
  bufferBetweenTripsMinutes: number; // Default: 10
  autoScheduleEnabled: boolean; // Default: true
  demandBasedFrequency: boolean; // Default: false
  peakHourMultiplier: number; // Default: 2.0 (double frequency during peak)
  peakHours: { start: string; end: string }[]; // Default: [{ start: '08:00', end: '10:00' }, { start: '17:00', end: '19:00' }]
}
```

---

## 9. Testing Strategy

### 9.1 Room Assignment Optimization Tests

```typescript
// src/logistics/accommodation/__tests__/room-assignment.optimizer.spec.ts

import { RoomAssignmentOptimizer } from "../room-assignment.optimizer";

describe("RoomAssignmentOptimizer", () => {
  describe("Protocol rank to room type mapping", () => {
    it("should assign Presidential Suite to Head of State", async () => {
      const optimizer = createOptimizer();
      const result = await optimizer.optimizeAssignments(tenantId, eventId, [headOfStateId]);
      expect(result.assignments[0].roomType).toBe("Presidential");
    });

    it("should assign Suite to Minister", async () => {
      const optimizer = createOptimizer();
      const result = await optimizer.optimizeAssignments(tenantId, eventId, [ministerId]);
      expect(result.assignments[0].roomType).toBe("Suite");
    });

    it("should assign Executive Room to Ambassador", async () => {
      const optimizer = createOptimizer();
      const result = await optimizer.optimizeAssignments(tenantId, eventId, [ambassadorId]);
      expect(result.assignments[0].roomType).toBe("Executive");
    });
  });

  describe("Delegation grouping", () => {
    it("should assign all delegation members to same hotel when capacity allows", async () => {
      const optimizer = createOptimizer();
      const delegationIds = [member1Id, member2Id, member3Id, member4Id];
      const result = await optimizer.optimizeAssignments(tenantId, eventId, delegationIds);

      const hotels = new Set(result.assignments.map((a) => a.hotelId));
      expect(hotels.size).toBe(1); // All in same hotel
    });

    it("should overflow to nearest hotel when primary is full", async () => {
      const optimizer = createOptimizer({ primaryHotelCapacity: 2 });
      const delegationIds = [member1Id, member2Id, member3Id];
      const result = await optimizer.optimizeAssignments(tenantId, eventId, delegationIds);

      expect(result.assignments.length).toBe(3);
      const hotels = new Set(result.assignments.map((a) => a.hotelId));
      expect(hotels.size).toBe(2); // Split across 2 hotels
    });

    it("should keep head of delegation in same hotel as majority", async () => {
      const optimizer = createOptimizer();
      const result = await optimizer.optimizeAssignments(tenantId, eventId);

      const headAssignment = result.assignments.find((a) => a.participantId === headOfDelegationId);
      const memberHotels = result.assignments
        .filter((a) => a.participantId !== headOfDelegationId)
        .map((a) => a.hotelId);

      expect(memberHotels).toContain(headAssignment!.hotelId);
    });
  });

  describe("Accessibility compliance", () => {
    it("should prioritize accessible rooms for participants with accessibility needs", async () => {
      const optimizer = createOptimizer();
      const result = await optimizer.optimizeAssignments(tenantId, eventId, [
        accessibleParticipantId,
      ]);

      expect(result.assignments[0].constraintViolations).not.toContain(
        "Room is not accessibility-compliant",
      );
    });
  });

  describe("Date matching", () => {
    it("should only assign rooms with overlapping date ranges", async () => {
      const optimizer = createOptimizer();
      const result = await optimizer.optimizeAssignments(tenantId, eventId, [lateArrivalId]);

      // Participant arrives Feb 12, block is Feb 10-17
      expect(result.assignments.length).toBe(1);
    });

    it("should fail assignment when no block covers participant dates", async () => {
      const optimizer = createOptimizer({ blockEndDate: new Date("2026-02-12") });
      const result = await optimizer.optimizeAssignments(tenantId, eventId, [extendedStayId]);

      expect(result.unassigned.length).toBe(1);
      expect(result.unassigned[0].reason).toContain("dates");
    });
  });

  describe("Overbooking management", () => {
    it("should respect overbooking limits", async () => {
      const optimizer = createOptimizer({ enableOverbooking: true, noShowRate: 0.08 });
      const result = await optimizer.optimizeAssignments(tenantId, eventId);

      // With 100 rooms and 8% overbooking, effective capacity is 108
      expect(result.assignments.length).toBeLessThanOrEqual(108);
    });
  });

  describe("Performance", () => {
    it("should complete 500-room assignment in under 10 seconds", async () => {
      const optimizer = createOptimizer({ participantCount: 500 });
      const start = Date.now();
      await optimizer.optimizeAssignments(tenantId, eventId);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10000);
    });
  });
});
```

### 9.2 Transport Scheduling Tests

```typescript
// src/logistics/transport/__tests__/route-optimizer.spec.ts

describe("RouteOptimizerService", () => {
  describe("Airport pickup scheduling", () => {
    it("should create pickup request 45 min after flight arrival", async () => {
      const service = createRouteOptimizer();
      const flightArrival = new Date("2026-02-10T14:30:00Z");

      const request = await service.createAirportPickup(participantId, flightArrival);
      const expectedPickup = new Date("2026-02-10T15:15:00Z");

      expect(request.scheduledTime).toEqual(expectedPickup);
    });

    it("should assign dedicated vehicle to Head of State", async () => {
      const service = createRouteOptimizer();
      const result = await service.optimizeRoutes(tenantId, eventId, timeWindow);

      const vipRoute = result.find((r) =>
        r.stops.some((s) => s.passengers.includes(headOfStateId)),
      );
      expect(vipRoute!.utilizationPercent).toBeLessThanOrEqual(50); // Mostly empty = dedicated
    });

    it("should group delegates arriving within 30-minute window", async () => {
      const service = createRouteOptimizer();
      // 3 delegates arriving at 14:00, 14:15, 14:20
      const result = await service.optimizeRoutes(tenantId, eventId, timeWindow);

      const groupedRoute = result.find((r) => r.stops[0].passengers.length >= 3);
      expect(groupedRoute).toBeDefined();
    });
  });

  describe("Flight delay handling", () => {
    it("should reschedule pickup when flight is delayed", async () => {
      const service = createRouteOptimizer();
      const result = await service.handleFlightDelay(requestId, new Date("2026-02-10T16:00:00Z"));

      expect(result.rescheduled).toBe(true);
      expect(result.newScheduledTime).toEqual(new Date("2026-02-10T16:45:00Z"));
    });

    it("should reassign vehicle when delay conflicts with next trip", async () => {
      const service = createRouteOptimizer();
      const result = await service.handleFlightDelay(requestId, delayedTime);

      expect(result.affectedRequests.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Shuttle scheduling", () => {
    it("should generate departures at configured frequency", async () => {
      const route = await createShuttleRoute({
        frequency: 15,
        startTime: "06:00",
        endTime: "22:00",
      });
      const departures = calculateShuttleDepartures(route);

      // 16 hours * 60 minutes / 15 minute frequency = 64 departures
      expect(departures.length).toBe(64);
    });
  });
});
```

### 9.3 Meal Forecasting Accuracy Tests

```typescript
// src/logistics/catering/__tests__/meal-forecasting.spec.ts

describe("MealForecastingService", () => {
  describe("Dietary aggregation", () => {
    it("should aggregate dietary preferences from participant custom data", async () => {
      const service = createMealForecasting();
      const breakdown = await service.getDietaryBreakdown(eventId, lunchService);

      expect(breakdown.STANDARD).toBeGreaterThan(0);
      expect(breakdown.HALAL).toBeDefined();
      expect(breakdown.VEGETARIAN).toBeDefined();
    });

    it("should default to STANDARD when dietary preference is missing", async () => {
      const service = createMealForecasting();
      // Participant with no dietary_preference in customData
      const breakdown = await service.getDietaryBreakdown(eventId, lunchService);

      expect(breakdown.STANDARD).toBeGreaterThanOrEqual(participantsWithNoPref);
    });

    it("should apply buffer multiplier to all dietary types", async () => {
      const service = createMealForecasting();
      const forecast = await service.forecastMealCounts(tenantId, eventId, targetDate, 1.1);

      for (const f of forecast) {
        expect(f.forecast.withBuffer.total).toBeGreaterThan(f.forecast.totalExpected);
      }
    });
  });

  describe("Historical consumption rates", () => {
    it("should reduce breakfast forecast by 25% (75% consumption rate)", async () => {
      const service = createMealForecasting();
      const forecast = await service.forecastMealCounts(tenantId, eventId, targetDate);

      const breakfast = forecast.find((f) => f.mealType === "BREAKFAST");
      // If 100 checked in, expect ~75 forecast
      expect(breakfast!.forecast.totalExpected).toBeLessThan(100);
    });

    it("should apply 92% consumption rate for lunch", async () => {
      const service = createMealForecasting();
      const forecast = await service.forecastMealCounts(tenantId, eventId, targetDate);

      const lunch = forecast.find((f) => f.mealType === "LUNCH");
      expect(lunch!.forecast.totalExpected).toBeCloseTo(checkedInCount * 0.92, -1);
    });
  });

  describe("Waste analysis", () => {
    it("should calculate waste percentage correctly", async () => {
      const service = createMealForecasting();
      const analysis = await service.analyzeWaste(eventId, mealServiceId);

      expect(analysis.wastePercent).toBeGreaterThanOrEqual(0);
      expect(analysis.wastePercent).toBeLessThanOrEqual(100);
    });

    it("should recommend buffer reduction when waste exceeds 20%", async () => {
      const service = createMealForecasting();
      const analysis = await service.analyzeWaste(eventId, highWasteServiceId);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations[0]).toContain("Reduce buffer");
    });
  });

  describe("QR scanning validation", () => {
    it("should accept valid voucher scan", async () => {
      const result = await scanVoucher(validQrCode, lunchServiceId);
      expect(result.result).toBe("PASS");
    });

    it("should reject already-collected voucher", async () => {
      await scanVoucher(validQrCode, lunchServiceId); // First scan
      const result = await scanVoucher(validQrCode, lunchServiceId); // Second scan
      expect(result.result).toBe("FAIL");
      expect(result.failReason).toBe("ALREADY_COLLECTED");
    });

    it("should reject voucher for wrong meal service", async () => {
      const result = await scanVoucher(dinnerQrCode, lunchServiceId);
      expect(result.result).toBe("FAIL");
      expect(result.failReason).toBe("WRONG_SERVICE");
    });

    it("should reject voucher outside service window", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-02-10T15:00:00Z")); // After lunch
      const result = await scanVoucher(validQrCode, lunchServiceId);
      expect(result.result).toBe("FAIL");
      expect(result.failReason).toBe("EXPIRED");
    });
  });
});
```

### 9.4 Floor Plan Rendering Tests

```typescript
// src/logistics/venue/__tests__/floor-plan-editor.spec.ts

describe("FloorPlanEditorService", () => {
  describe("Element placement validation", () => {
    it("should reject elements placed outside image bounds", async () => {
      const service = createFloorPlanEditor();
      const result = service.renderEngine.validatePlacement(
        [{ id: "1", type: "ROOM", name: "Test", x: 2000, y: 100, width: 200, height: 100 }],
        1920,
        1080,
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("out of bounds");
    });

    it("should reject overlapping room elements", async () => {
      const service = createFloorPlanEditor();
      const result = service.renderEngine.validatePlacement(
        [
          { id: "1", type: "ROOM", name: "Room A", x: 100, y: 100, width: 200, height: 100 },
          { id: "2", type: "ROOM", name: "Room B", x: 200, y: 100, width: 200, height: 100 },
        ],
        1920,
        1080,
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("overlaps");
    });

    it("should accept valid non-overlapping placement", async () => {
      const service = createFloorPlanEditor();
      const result = service.renderEngine.validatePlacement(
        [
          { id: "1", type: "ROOM", name: "Room A", x: 100, y: 100, width: 200, height: 100 },
          { id: "2", type: "ROOM", name: "Room B", x: 400, y: 100, width: 200, height: 100 },
        ],
        1920,
        1080,
      );

      expect(result.valid).toBe(true);
    });
  });

  describe("Room booking conflict detection", () => {
    it("should detect overlapping bookings", async () => {
      const service = createBookingService();
      const conflict = await service.checkConflicts({
        roomId: "room1",
        startTime: new Date("2026-02-10T09:00:00Z"),
        endTime: new Date("2026-02-10T11:00:00Z"),
      });

      expect(conflict.hasConflicts).toBe(true);
    });

    it("should include setup/teardown buffer in conflict check", async () => {
      const service = createBookingService();
      // Existing booking: 10:00-11:00 with 30min setup, 15min teardown
      // New booking: 08:45-09:30 (overlaps with setup at 09:30)
      const conflict = await service.checkConflicts({
        roomId: "room1",
        startTime: new Date("2026-02-10T08:45:00Z"),
        endTime: new Date("2026-02-10T09:30:00Z"),
        setupTime: 0,
        teardownTime: 0,
      });

      expect(conflict.hasConflicts).toBe(true);
    });
  });

  describe("Rendering performance", () => {
    it("should render complex floor plan in under 2 seconds", async () => {
      const engine = createRenderEngine();
      const start = Date.now();

      await engine.getRenderData(complexFloorPlanId); // 50+ rooms, 20+ zones
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });
  });
});
```

### 9.5 Parking Availability Real-Time Update Tests

```typescript
// src/logistics/parking/__tests__/parking-access.spec.ts

describe("ParkingAccessService", () => {
  describe("Gate scanning", () => {
    it("should allow entry with valid active permit", async () => {
      const service = createParkingAccess();
      const result = await service.processGateScan(validQr, zoneId, "ENTRY", "guard1");

      expect(result.result).toBe("ALLOWED");
    });

    it("should deny entry when zone is full", async () => {
      const service = createParkingAccess({ zoneOccupancy: 50, zoneCapacity: 50 });
      const result = await service.processGateScan(validQr, zoneId, "ENTRY", "guard1");

      expect(result.result).toBe("DENIED_FULL");
      expect(result.alternativeZone).toBeDefined();
    });

    it("should deny entry with expired permit", async () => {
      const service = createParkingAccess();
      const result = await service.processGateScan(expiredQr, zoneId, "ENTRY", "guard1");

      expect(result.result).toBe("DENIED_EXPIRED");
    });

    it("should deny entry for wrong zone", async () => {
      const service = createParkingAccess();
      const result = await service.processGateScan(zoneAQr, zoneBId, "ENTRY", "guard1");

      expect(result.result).toBe("DENIED_ACCESS");
    });

    it("should increment occupancy on entry", async () => {
      const service = createParkingAccess({ zoneOccupancy: 40 });
      await service.processGateScan(validQr, zoneId, "ENTRY", "guard1");

      const zone = await getZone(zoneId);
      expect(zone.occupancy).toBe(41);
    });

    it("should decrement occupancy on exit", async () => {
      const service = createParkingAccess({ zoneOccupancy: 40 });
      await service.processGateScan(validQr, zoneId, "EXIT", "guard1");

      const zone = await getZone(zoneId);
      expect(zone.occupancy).toBe(39);
    });

    it("should never go below zero occupancy", async () => {
      const service = createParkingAccess({ zoneOccupancy: 0 });
      await service.processGateScan(validQr, zoneId, "EXIT", "guard1");

      const zone = await getZone(zoneId);
      expect(zone.occupancy).toBe(0);
    });
  });

  describe("Real-time updates", () => {
    it("should update occupancy within 200ms of gate scan", async () => {
      const service = createParkingAccess();
      const start = Date.now();
      await service.processGateScan(validQr, zoneId, "ENTRY", "guard1");
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200);
    });

    it("should suggest alternative zone when primary is full", async () => {
      const service = createParkingAccess({ zoneOccupancy: 50, zoneCapacity: 50 });
      const result = await service.processGateScan(validQr, zoneId, "ENTRY", "guard1");

      expect(result.alternativeZone).toBeDefined();
      expect(result.alternativeZone).not.toBe(zoneName);
    });
  });
});
```

### 9.6 Integration & E2E Tests

```typescript
// src/logistics/__tests__/e2e/logistics-lifecycle.spec.ts

describe("Logistics Lifecycle E2E", () => {
  it("should auto-assign room, transport, and meals on participant approval", async () => {
    // 1. Register participant with flight data and dietary preference
    const participant = await registerParticipant({
      name: "Test Delegate",
      type: "Delegate",
      customData: {
        dietary_preference: "HALAL",
        flight_number: "ET502",
        flight_arrival_time: "2026-02-10T14:30:00Z",
        terminal: "Terminal 2",
      },
    });

    // 2. Approve participant
    await approveParticipant(participant.id);

    // 3. Verify room assignment created
    const roomAssignment = await getRoomAssignment(participant.id);
    expect(roomAssignment).toBeDefined();
    expect(roomAssignment.status).toBe("RESERVED");
    expect(roomAssignment.roomBlock.roomType).toBe("Double");

    // 4. Verify transport request created
    const transportRequest = await getTransportRequest(participant.id);
    expect(transportRequest).toBeDefined();
    expect(transportRequest.type).toBe("AIRPORT_PICKUP");
    expect(transportRequest.flightNumber).toBe("ET502");

    // 5. Verify meal vouchers generated
    const vouchers = await getMealVouchers(participant.id);
    expect(vouchers.length).toBeGreaterThan(0);
    expect(vouchers[0].dietaryType).toBe("HALAL");
  });

  it("should release resources when participant is rejected", async () => {
    const participant = await registerAndApprove();
    const roomBefore = await getRoomAssignment(participant.id);
    expect(roomBefore.status).toBe("RESERVED");

    await rejectParticipant(participant.id);

    const roomAfter = await getRoomAssignment(participant.id);
    expect(roomAfter.status).toBe("CANCELLED");

    const transport = await getTransportRequest(participant.id);
    expect(transport.status).toBe("CANCELLED");
  });
});
```

---

## 10. Security Considerations

### 10.1 Vendor Data Isolation

Vendors must only access data relevant to their contracts. The vendor portal uses time-limited, read-only tokens with strict data scoping:

```typescript
// Vendor portal access control
interface VendorPortalScope {
  vendorId: string;
  category: VendorCategory;
  eventId: string;
  permissions: {
    viewMealCounts: boolean; // Catering vendors only
    viewDietaryBreakdown: boolean;
    viewTransportSchedule: boolean; // Transport vendors only
    viewParkingData: boolean; // Never -- contains PII
    viewParticipantNames: boolean; // Never
    viewDelegationData: boolean; // Never
  };
  expiresAt: Date;
}

// Data filtering for vendor portal
// - Strip all participant names, IDs, and delegation info
// - Show only aggregate counts and dietary breakdowns
// - No access to raw participant data or PII
// - Audit log of every vendor portal access
```

### 10.2 PII in Transport Manifests

Transport manifests contain sensitive participant information (names, flight numbers, hotel assignments). Access controls:

```typescript
interface TransportPiiPolicy {
  // Who can view full manifests
  fullAccessRoles: ["LOGISTICS_COORDINATOR", "TRANSPORT_DISPATCHER"];

  // Drivers see only their assigned passengers
  driverView: {
    canSeePassengerName: true;
    canSeeFlightNumber: true;
    canSeeHotelName: true;
    canSeeRoomNumber: false; // Never shown to drivers
    canSeeDelegation: false;
    canSeeProtocolRank: false;
  };

  // Manifest exports are watermarked and tracked
  exportPolicy: {
    watermarkWithUserId: true;
    trackDownloads: true;
    autoExpireAfterHours: 24;
    requireMFA: true;
  };
}
```

### 10.3 Location Data Privacy

Vehicle GPS tracking data is sensitive and must be handled carefully:

```typescript
interface LocationDataPolicy {
  // GPS data retention
  retentionPolicy: {
    livePositions: "5 minutes"; // Only latest position cached
    tripHistory: "30 days"; // Trip start/end retained
    rawGpsPoints: "7 days"; // Detailed track data
    postEventPurge: true; // All GPS data purged after event
  };

  // Access control
  accessPolicy: {
    liveTracking: ["TRANSPORT_DISPATCHER", "COMMAND_CENTER"];
    tripHistory: ["LOGISTICS_COORDINATOR"];
    rawGpsData: ["SYSTEM_ADMIN"];
    participantView: false; // Participants cannot track their vehicle
  };

  // Geofencing
  geofencePolicy: {
    alertsOnlyToOperations: true;
    noParticipantGeofencing: true; // Never track participant locations
    vehicleGeofencesOnly: true;
  };
}
```

### 10.4 Room Assignment Confidentiality

VIP room numbers are sensitive information that could pose security risks:

```typescript
interface RoomConfidentialityPolicy {
  // VIP room numbers are classified
  vipRoomVisibility: {
    visibleToParticipant: true;
    visibleToHotelLiaison: true;
    visibleToProtocolOfficer: true;
    visibleToLogisticsCoordinator: true;
    visibleToCateringStaff: false;
    visibleToTransportDriver: false;
    visibleToGeneralStaff: false;
  };

  // Rooming list access
  roomingListAccess: {
    fullList: ["LOGISTICS_COORDINATOR", "HOTEL_LIAISON"];
    delegationOnly: ["FOCAL_POINT"]; // See only their delegation
    noRoomNumbers: ["GENERAL_STAFF"];
  };

  // Export security
  roomingListExport: {
    encrypted: true;
    passwordProtected: true;
    watermarked: true;
    auditLogged: true;
  };
}
```

### 10.5 Parking Permit Validation

Parking permit QR codes must resist forgery and replay attacks:

```typescript
interface ParkingSecurityPolicy {
  // QR payload encryption
  qrEncryption: {
    algorithm: "AES-256-GCM";
    payload: "permitId + zoneId + vehiclePlate + validFrom + validTo";
    signedWithTenantKey: true;
  };

  // Anti-replay
  antiReplay: {
    singleUsePerEntry: false; // Same permit can re-enter after exit
    cooldownMinutes: 5; // Min 5 min between entry scans
    maxEntriesPerDay: 10; // Flag if >10 entries in one day
  };

  // Permit revocation
  revocation: {
    immediateEffect: true; // Revoked permits rejected at next scan
    revokedPermitAlert: true; // Alert security if revoked permit scanned
  };
}
```

---

## 11. Performance Requirements

### 11.1 Floor Plan Rendering Targets

| Metric                         | Target  | Measurement                                     |
| ------------------------------ | ------- | ----------------------------------------------- |
| Floor plan initial load        | < 2s    | Time from navigation to fully rendered canvas   |
| Floor plan with 50+ rooms      | < 2s    | Complex plans with zones and equipment overlays |
| Element drag-and-drop response | < 50ms  | Time from mouse move to element reposition      |
| Floor plan image upload        | < 5s    | For 20MB max file size                          |
| Thumbnail generation           | < 3s    | Background task after upload                    |
| Zone overlay rendering         | < 500ms | Polygon rendering on canvas                     |

### 11.2 Real-Time Vehicle Tracking

| Metric                        | Target    | Measurement                     |
| ----------------------------- | --------- | ------------------------------- |
| GPS position update frequency | Every 15s | From vehicle GPS to Redis cache |
| Position display update       | < 1s      | SSE push to dashboard client    |
| Fleet overview load           | < 2s      | All vehicle positions on map    |
| ETA calculation               | < 500ms   | Distance + speed estimation     |
| Geofence detection            | < 2s      | From position update to alert   |
| Nearby vehicle search         | < 200ms   | Georadius query in Redis        |

### 11.3 Meal Service Throughput

| Metric                   | Target                     | Measurement                           |
| ------------------------ | -------------------------- | ------------------------------------- |
| QR scan + validation     | < 500ms                    | From scan to pass/fail display        |
| Scanning throughput      | 500 scans/hour per station | ~8.3 scans/minute per station         |
| Live stats update        | < 2s                       | From scan to dashboard counter update |
| Dietary aggregation      | < 3s                       | For 5000 participants                 |
| Voucher generation batch | < 30s                      | For 1000 vouchers                     |
| Vendor dashboard refresh | < 5s                       | Every 5 minute polling interval       |

### 11.4 Parking Availability Query

| Metric                       | Target  | Measurement                 |
| ---------------------------- | ------- | --------------------------- |
| Gate scan + validation       | < 200ms | From QR scan to result      |
| Occupancy update propagation | < 500ms | From scan to all dashboards |
| Zone overview query          | < 200ms | All zones with occupancy    |
| Permit lookup by plate       | < 100ms | Indexed query               |
| Car pass PDF generation      | < 2s    | Single permit to PDF        |
| Batch permit generation      | < 30s   | For 200 permits             |

### 11.5 Room Assignment Optimization

| Metric                       | Target  | Measurement                        |
| ---------------------------- | ------- | ---------------------------------- |
| Auto-assign 500 participants | < 10s   | Full constraint satisfaction solve |
| Auto-assign 100 participants | < 3s    | Smaller batch                      |
| Single room assignment       | < 200ms | Manual assignment via UI           |
| Rooming list PDF generation  | < 5s    | Per hotel, up to 200 rooms         |
| Hotel occupancy query        | < 200ms | Aggregate with assignment counts   |
| Room availability check      | < 100ms | Single block availability          |

### 11.6 Performance Budget Summary

```
┌─────────────────────────────────────────────────────────────┐
│  PERFORMANCE BUDGET — LOGISTICS MODULE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Critical Path Operations (< 500ms)                          │
│  ├── Parking gate scan validation          200ms            │
│  ├── Meal QR scan validation               500ms            │
│  ├── Zone access scan                      300ms            │
│  ├── Room availability check               100ms            │
│  └── Parking zone overview                 200ms            │
│                                                              │
│  Dashboard Operations (< 2s)                                 │
│  ├── Floor plan rendering                  2,000ms          │
│  ├── Fleet overview with GPS               2,000ms          │
│  ├── Accommodation dashboard               1,500ms          │
│  ├── Live meal stats update                2,000ms          │
│  └── Zone operations dashboard             1,500ms          │
│                                                              │
│  Batch Operations (< 30s)                                    │
│  ├── Room auto-assignment (500)            10,000ms         │
│  ├── Voucher generation (1000)             30,000ms         │
│  ├── Permit batch generation (200)         30,000ms         │
│  └── Transport manifest PDF                5,000ms          │
│                                                              │
│  Real-Time Streaming                                         │
│  ├── GPS position updates                  Every 15s        │
│  ├── Occupancy counter updates             < 500ms latency  │
│  └── Meal collection rate                  < 2s latency     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Open Questions & Decisions

| #   | Question                                    | Status | Options                                                                                                                                                              | Notes                                                                                                                     |
| --- | ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | **GPS tracking privacy regulations**        | OPEN   | (a) Track only fleet vehicles, never personal, (b) Opt-in tracking for participant vehicles, (c) No GPS tracking, manual status updates only                         | Different jurisdictions have varying requirements for vehicle tracking. GDPR and AU data protection frameworks may apply. |
| 2   | **Catering waste tracking integration**     | OPEN   | (a) Manual waste logs by catering staff, (b) Weighing station integration at kitchen, (c) AI-based plate waste estimation                                            | Waste tracking can reduce costs by 15-20% but requires hardware investment.                                               |
| 3   | **Smart parking sensor hardware**           | OPEN   | (a) QR-only (manual gate scanning), (b) ANPR (Automatic Number Plate Recognition) cameras, (c) Ground-embedded IoT sensors, (d) Hybrid approach                      | Sensor integration provides real-time accuracy but adds hardware cost and maintenance.                                    |
| 4   | **3D venue visualization**                  | OPEN   | (a) 2D floor plans only (current), (b) 2.5D isometric view, (c) Full 3D WebGL rendering, (d) AR-based venue walkthrough                                              | 3D adds significant complexity but improves wayfinding and event planning. Consider using Three.js or Babylon.js.         |
| 5   | **Vendor self-service portal**              | OPEN   | (a) Read-only dashboard (current), (b) Vendor can update delivery status, (c) Full vendor portal with invoice submission, (d) API integration for vendor ERP systems | Self-service reduces admin overhead but requires vendor onboarding.                                                       |
| 6   | **Carbon footprint per logistics decision** | OPEN   | (a) Not tracked (simplest), (b) Estimated from vehicle types and distances, (c) Full carbon accounting with offsets, (d) Sustainability reporting dashboard          | Growing demand for event sustainability metrics. AU events increasingly require carbon reporting.                         |
| 7   | **Real-time translation in venue signage**  | OPEN   | (a) Static multilingual signs, (b) Digital signage with language rotation, (c) QR-to-translate on signs                                                              | AU events use 4+ official languages.                                                                                      |
| 8   | **Shuttle demand prediction model**         | OPEN   | (a) Fixed schedule (current), (b) Rule-based demand adjustment, (c) ML-based prediction from historical patterns                                                     | Dynamic frequency can reduce both wait times and empty runs.                                                              |
| 9   | **Hotel API integration**                   | OPEN   | (a) Manual rooming list exchange, (b) PMS integration (Opera, Mews), (c) Channel manager integration                                                                 | Direct PMS integration enables real-time room status but varies by hotel chain.                                           |
| 10  | **Accessibility compliance standard**       | OPEN   | (a) Basic wheelchair accessibility tracking, (b) Full ADA/ISO 21542 compliance, (c) Custom accessibility scoring per room                                            | Need to determine which standard applies for AU events.                                                                   |

---

## Appendix

### A. Glossary

| Term                              | Definition                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Room Block**                    | A pre-negotiated allocation of hotel rooms reserved for event participants, typically at a group rate                  |
| **Rooming List**                  | A document sent to hotels listing all guests, room assignments, and check-in/out dates                                 |
| **Motorcade**                     | A procession of vehicles escorting a VIP, typically including security vehicles and motorcycle escorts                 |
| **Meal Voucher**                  | A QR-code-based authorization allowing a participant to collect a specific meal at a specific service point            |
| **Dietary Aggregation**           | The process of collecting and summarizing dietary requirements across all participants for kitchen production planning |
| **Car Pass**                      | A printed document displayed on a vehicle dashboard granting access to a specific parking zone                         |
| **Gate Log**                      | A record of a vehicle entry or exit at a parking zone gate, including permit validation result                         |
| **Floor Plan**                    | A scaled image of a venue floor with overlaid interactive elements (rooms, zones, equipment)                           |
| **Zone**                          | A logical area within an event venue with defined access rules, capacity limits, and operational management            |
| **Travel Time Matrix**            | A table of estimated travel times between all pairs of event zones, used for schedule validation                       |
| **Inter-Zone Shuttle**            | A scheduled vehicle service connecting two event zones, typically on a fixed route and frequency                       |
| **SLA (Service Level Agreement)** | Contractual performance standards for vendors, defining expected service quality and penalties                         |
| **Buffer Multiplier**             | A percentage added to forecasted meal counts to accommodate unexpected demand (typically 10%)                          |
| **Overbooking**                   | Intentionally assigning more rooms than physically available, based on expected no-show rates                          |
| **Geofence**                      | A virtual geographic boundary that triggers alerts when a tracked vehicle enters or exits                              |
| **Capacity Plan**                 | An aggregate demand forecast across all logistics domains used for resource allocation decisions                       |
| **ANPR**                          | Automatic Number Plate Recognition -- camera-based system for identifying vehicle license plates                       |
| **PMS**                           | Property Management System -- hotel software for managing reservations, check-in, and room inventory                   |
| **SSE**                           | Server-Sent Events -- a server push technology for streaming real-time updates to web clients                          |

### B. References

| #   | Reference                               | Description                                    |
| --- | --------------------------------------- | ---------------------------------------------- |
| 1   | SYSTEM_DESIGN.md Section 12.8           | Accommodation Management source design         |
| 2   | SYSTEM_DESIGN.md Section 12.9           | Transportation & Logistics source design       |
| 3   | SYSTEM_DESIGN.md Section 12.16          | Catering & Meal Management source design       |
| 4   | SYSTEM_DESIGN.md Section 12.25          | Parking & Zone Access Management source design |
| 5   | SYSTEM_DESIGN.md Section 12.28          | Venue & Floor Plan Management source design    |
| 6   | SYSTEM_DESIGN.md Section 12.33          | Multi-Venue & Zone Coordination source design  |
| 7   | Module 01: Data Model Foundation        | Core data model and tenant structure           |
| 8   | Module 05: Security & Access Control    | Authentication, authorization, RBAC            |
| 9   | Module 09: Registration & Accreditation | Participant registration data flow             |
| 10  | Module 10: Event Operations Center      | Check-in data, operational dashboard           |
| 11  | Module 12: Protocol & Diplomacy         | Protocol rank definitions, VIP handling        |
| 12  | Module 13: People & Workforce           | Staff management, shift scheduling             |
| 13  | Module 07: API & Integration Layer      | API gateway, authentication middleware         |

### C. Logistics Domain Interaction Matrix

This matrix shows how the six logistics domains share data and resources with each other and with external modules.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                LOGISTICS DOMAIN INTERACTION MATRIX                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INTERNAL DOMAIN INTERACTIONS                                                │
│                                                                              │
│  Accommodation ──► Transport                                                 │
│    Hotel addresses serve as default pickup/dropoff locations                 │
│    Check-in/check-out dates determine transport scheduling window            │
│                                                                              │
│  Accommodation ──► Catering                                                  │
│    Hotel meal plan inclusion affects venue catering counts                   │
│    VIP room service requests routed to catering vendors                     │
│                                                                              │
│  Transport ──► Zones                                                         │
│    Shuttle schedules connect zones                                           │
│    Vehicle GPS positions shown on zone maps                                 │
│    Driver staff counts appear in zone staffing views                        │
│                                                                              │
│  Catering ──► Zones                                                          │
│    Meal service points are located within zones                             │
│    Zone occupancy informs meal count forecasts                              │
│    Catering staff deployed to zone-based service points                     │
│                                                                              │
│  Parking ──► Zones                                                           │
│    Parking zones are a type of event zone                                   │
│    Gate log data feeds zone occupancy counts                                │
│    Parking overflow affects nearby zone congestion                          │
│                                                                              │
│  Venue ──► All Domains                                                       │
│    Venue locations define transport routes                                   │
│    Room bookings define session locations for catering planning             │
│    Floor plans provide spatial context for all zone operations              │
│    Room equipment tracking informs setup task generation                    │
│                                                                              │
│  EXTERNAL MODULE INTERACTIONS                                                │
│                                                                              │
│  ┌────────────┬───────────┬──────────┬────────────┬─────────────────────┐   │
│  │ External   │ Direction │ Domains  │ Data Flow  │ Trigger             │   │
│  │ Module     │           │ Affected │            │                     │   │
│  ├────────────┼───────────┼──────────┼────────────┼─────────────────────┤   │
│  │ Module 09  │ Inbound   │ All 6    │ Participant│ participant.approved│   │
│  │ Registration│          │          │ data       │                     │   │
│  ├────────────┼───────────┼──────────┼────────────┼─────────────────────┤   │
│  │ Module 10  │ Inbound   │ Catering │ Check-in   │ participant.        │   │
│  │ Operations │           │ Zones    │ status     │ checked_in          │   │
│  ├────────────┼───────────┼──────────┼────────────┼─────────────────────┤   │
│  │ Module 12  │ Inbound   │ All VIP  │ Protocol   │ protocol.           │   │
│  │ Protocol   │           │ domains  │ requirements│ requirements_updated│   │
│  ├────────────┼───────────┼──────────┼────────────┼─────────────────────┤   │
│  │ Module 13  │ Both      │ All 6    │ Staff      │ staff.assigned /    │   │
│  │ Workforce  │           │          │ deployment │ staff.required      │   │
│  ├────────────┼───────────┼──────────┼────────────┼─────────────────────┤   │
│  │ Module 14  │ Outbound  │ All 6    │ Notifica-  │ Various logistics   │   │
│  │ Comms      │           │          │ tions      │ events              │   │
│  ├────────────┼───────────┼──────────┼────────────┼─────────────────────┤   │
│  │ Module 07  │ Both      │ All 6    │ API calls  │ All API operations  │   │
│  │ API Layer  │           │          │            │                     │   │
│  └────────────┴───────────┴──────────┴────────────┴─────────────────────┘   │
│                                                                              │
│  SHARED RESOURCES                                                            │
│                                                                              │
│  ┌─────────────────────┬──────────────────────────────────────────┐         │
│  │ Shared Resource     │ Used By                                  │         │
│  ├─────────────────────┼──────────────────────────────────────────┤         │
│  │ Location Service    │ Transport, Parking, Venue, Zones         │         │
│  │ Capacity Engine     │ Accommodation, Catering, Parking, Zones  │         │
│  │ Vendor Management   │ Catering, Transport, Parking, Venue      │         │
│  │ QR Scanning Infra   │ Catering, Parking, Zones                 │         │
│  │ Rendering Engine    │ Venue, Zones, Parking (maps)             │         │
│  │ Notification Bus    │ All 6 domains                            │         │
│  │ Redis Cache         │ All 6 domains (real-time data)           │         │
│  └─────────────────────┴──────────────────────────────────────────┘         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

_End of Module 11: Logistics and Venue Management_
