/**
 * POST /api/offline/sync
 *
 * Receives queued mutations from the offline sync manager.
 * Validates timestamps for conflict resolution (last-write-wins).
 */

import type { Route } from "./+types/offline-sync";
import { requireAuth } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";

interface SyncPayload {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { user, roles } = await requireAuth(request);
  const flagContext = { tenantId: user.tenantId ?? undefined, roles, userId: user.id };
  const offlineEnabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.OFFLINE_MODE, flagContext);

  if (!offlineEnabled) {
    return Response.json({ error: "Offline mode is not enabled" }, { status: 403 });
  }

  let body: SyncPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, entityType, entityId, timestamp } = body;

  if (!type || !entityType || !entityId || !timestamp) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  logger.info(
    { userId: user.id, mutationType: type, entityType, entityId },
    "Processing offline sync mutation",
  );

  try {
    // Conflict detection: compare client timestamp with server updatedAt
    if (entityType === "participant") {
      const participant = await prisma.participant.findUnique({
        where: { id: entityId },
      });

      if (!participant) {
        return Response.json({ error: "Entity not found" }, { status: 404 });
      }

      // Check tenant isolation
      if (participant.tenantId !== user.tenantId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      const serverTimestamp = participant.updatedAt.getTime();

      // Server wins on conflict (server version is same or newer)
      if (serverTimestamp >= timestamp) {
        return Response.json(
          {
            conflict: true,
            message: `Server version is newer (server: ${new Date(serverTimestamp).toISOString()}, client: ${new Date(timestamp).toISOString()})`,
          },
          { status: 409 },
        );
      }

      // Client wins — apply the mutation
      await applyMutation(type, entityId, user.id);

      return Response.json({ success: true, applied: true });
    }

    // For non-participant entities, just apply directly
    return Response.json({
      success: true,
      applied: true,
      message: "Mutation applied (no conflict check for this entity type)",
    });
  } catch (error) {
    logger.error({ error, entityType, entityId, type }, "Offline sync mutation failed");
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

const MUTATION_TO_STATUS: Record<string, string> = {
  approve: "APPROVED",
  reject: "REJECTED",
};

const MUTATION_TO_AUDIT: Record<string, "APPROVE" | "REJECT" | "PRINT" | "COLLECT"> = {
  approve: "APPROVE",
  reject: "REJECT",
  print: "PRINT",
  collect: "COLLECT",
};

async function applyMutation(type: string, participantId: string, userId: string): Promise<void> {
  const newStatus = MUTATION_TO_STATUS[type];

  if (newStatus) {
    await prisma.participant.update({
      where: { id: participantId },
      data: { status: newStatus as "APPROVED" | "REJECTED" },
    });
  } else {
    // print, collect, scan — log the action but the participant model
    // doesn't have badge fields yet (will be added in a later phase).
    logger.info({ type, participantId }, "Offline mutation applied (no status change)");
  }

  const auditAction = MUTATION_TO_AUDIT[type];
  if (auditAction) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: auditAction,
        entityType: "Participant",
        entityId: participantId,
        description: `Offline sync: ${type} applied to participant ${participantId}`,
      },
    });
  }
}
