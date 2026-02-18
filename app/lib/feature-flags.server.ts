import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import type { UpdateFlagInput } from "~/lib/schemas/settings";

// ─── Types ────────────────────────────────────────────────

interface FlagContext {
  tenantId?: string;
  roles?: string[];
  userId?: string;
}

interface ServiceContext {
  userId: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface FlagWithStatus {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  enabledForTenants: string[];
  enabledForRoles: string[];
  enabledForUsers: string[];
  isEnabled: boolean; // computed for the given context
  createdAt: Date;
  updatedAt: Date;
}

// ─── Feature Flag Keys ────────────────────────────────────

export const FEATURE_FLAG_KEYS = {
  VISUAL_FORM_DESIGNER: "FF_VISUAL_FORM_DESIGNER",
  SSE_UPDATES: "FF_SSE_UPDATES",
  KEYBOARD_SHORTCUTS: "FF_KEYBOARD_SHORTCUTS",
  NOTIFICATIONS: "FF_NOTIFICATIONS",
  GLOBAL_SEARCH: "FF_GLOBAL_SEARCH",
  I18N: "FF_I18N",
  CONDITIONAL_ROUTING: "FF_CONDITIONAL_ROUTING",
  STEP_ASSIGNMENT: "FF_STEP_ASSIGNMENT",
  AUTO_ACTIONS: "FF_AUTO_ACTIONS",
  DELEGATION_PORTAL: "FF_DELEGATION_PORTAL",
  SAVED_VIEWS: "FF_SAVED_VIEWS",
  CUSTOM_OBJECTS: "FF_CUSTOM_OBJECTS",
  ANALYTICS_DASHBOARD: "FF_ANALYTICS_DASHBOARD",
  PWA: "FF_PWA",
  OFFLINE_MODE: "FF_OFFLINE_MODE",
  REST_API: "FF_REST_API",
  WEBHOOKS: "FF_WEBHOOKS",
  BULK_OPERATIONS: "FF_BULK_OPERATIONS",
  EVENT_CLONE: "FF_EVENT_CLONE",
  WAITLIST: "FF_WAITLIST",
  COMMUNICATION_HUB: "FF_COMMUNICATION_HUB",
  KIOSK_MODE: "FF_KIOSK_MODE",
  PARALLEL_WORKFLOWS: "FF_PARALLEL_WORKFLOWS",

  // Phase 5 feature flags
  ACCOMMODATION: "FF_ACCOMMODATION",
  TRANSPORT: "FF_TRANSPORT",
  CATERING: "FF_CATERING",
  PROTOCOL_SEATING: "FF_PROTOCOL_SEATING",
  BILATERAL_SCHEDULER: "FF_BILATERAL_SCHEDULER",
  INCIDENT_MANAGEMENT: "FF_INCIDENT_MANAGEMENT",
  STAFF_MANAGEMENT: "FF_STAFF_MANAGEMENT",
  COMPLIANCE_DASHBOARD: "FF_COMPLIANCE_DASHBOARD",
  SURVEYS: "FF_SURVEYS",
} as const;

// ─── SDK Functions ────────────────────────────────────────

/**
 * Check if a feature flag is enabled for the given context.
 * Returns true if:
 * - flag.enabled is true (globally on), OR
 * - context.tenantId is in enabledForTenants, OR
 * - any of context.roles is in enabledForRoles, OR
 * - context.userId is in enabledForUsers
 */
export async function isFeatureEnabled(key: string, context?: FlagContext): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) return false;

  return evaluateFlag(flag, context);
}

function evaluateFlag(
  flag: {
    enabled: boolean;
    enabledForTenants: string[];
    enabledForRoles: string[];
    enabledForUsers: string[];
  },
  context?: FlagContext,
): boolean {
  if (flag.enabled) return true;
  if (!context) return false;

  if (context.tenantId && flag.enabledForTenants.includes(context.tenantId)) return true;
  if (context.roles?.some((role) => flag.enabledForRoles.includes(role))) return true;
  if (context.userId && flag.enabledForUsers.includes(context.userId)) return true;

  return false;
}

/**
 * Get all feature flags with computed isEnabled for the given context.
 */
export async function getAllFlags(context?: FlagContext): Promise<FlagWithStatus[]> {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  });

  return flags.map((flag) => ({
    ...flag,
    isEnabled: evaluateFlag(flag, context),
  }));
}

/**
 * Update a feature flag by key.
 */
export async function setFlag(key: string, updates: UpdateFlagInput, ctx: ServiceContext) {
  const flag = await prisma.featureFlag.update({
    where: { key },
    data: {
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.enabledForTenants !== undefined && {
        enabledForTenants: updates.enabledForTenants,
      }),
      ...(updates.enabledForRoles !== undefined && { enabledForRoles: updates.enabledForRoles }),
      ...(updates.enabledForUsers !== undefined && { enabledForUsers: updates.enabledForUsers }),
    },
  });

  logger.info({ flagId: flag.id, key, enabled: flag.enabled }, "Feature flag updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId ?? null,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "FeatureFlag",
      entityId: flag.id,
      description: `Updated feature flag "${key}" (enabled: ${flag.enabled})`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { key, ...updates },
    },
  });

  return flag;
}
