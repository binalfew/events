import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { createBulkOperation } from "~/services/bulk-operations.server";
import { captureSnapshot } from "~/services/bulk-import/undo.server";
import { processWorkflowAction } from "~/services/workflow-engine/navigation.server";
import { validateBatchEligibility } from "~/services/batch-selection.server";
import type { BatchActionInput } from "~/lib/schemas/batch-action";
import type { BulkOperationType, ApprovalAction } from "../generated/prisma/client.js";

// ─── Constants ───────────────────────────────────────────

const BATCH_SIZE = 20;
const UNDO_WINDOW_HOURS = 24;

// ─── Types ───────────────────────────────────────────────

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

interface BatchActionResult {
  operationId: string;
  totalItems: number;
  successCount: number;
  failureCount: number;
  status: string;
}

interface DryRunResult {
  eligible: string[];
  ineligible: { id: string; name: string; reason: string }[];
  totalCount: number;
  eligibleCount: number;
  ineligibleCount: number;
}

// ─── Helpers ─────────────────────────────────────────────

function actionToBulkType(action: string): BulkOperationType {
  switch (action) {
    case "APPROVE":
      return "BULK_APPROVE";
    case "REJECT":
      return "BULK_REJECT";
    case "BYPASS":
      return "BULK_BYPASS";
    default:
      throw new Error(`Unknown batch action: ${action}`);
  }
}

// ─── Execute Batch Action ───────────────────────────────

export async function executeBatchAction(
  input: BatchActionInput,
  ctx: ServiceContext,
): Promise<BatchActionResult> {
  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.BULK_OPERATIONS);
  if (!enabled) {
    throw new Error("Bulk operations feature is not enabled");
  }

  const bulkType = actionToBulkType(input.action);

  // Create BulkOperation with CONFIRMED status (skip VALIDATING/PREVIEW)
  const operation = await createBulkOperation(
    {
      eventId: input.eventId,
      type: bulkType,
      description: `Batch ${input.action.toLowerCase()} for ${input.participantIds.length} participants`,
      initialStatus: "CONFIRMED",
    },
    ctx,
  );

  // Move to PROCESSING
  await prisma.bulkOperation.update({
    where: { id: operation.id },
    data: {
      status: "PROCESSING",
      startedAt: new Date(),
      totalItems: input.participantIds.length,
    },
  });

  let successCount = 0;
  let failureCount = 0;
  const processedParticipantIds: string[] = [];

  // Process in batches of 20
  for (let i = 0; i < input.participantIds.length; i += BATCH_SIZE) {
    const batchIds = input.participantIds.slice(i, i + BATCH_SIZE);

    // Fetch current state for each participant in this batch
    const participants = await prisma.participant.findMany({
      where: { id: { in: batchIds }, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        currentStepId: true,
      },
    });

    const participantMap = new Map(participants.map((p) => [p.id, p]));

    for (const participantId of batchIds) {
      const participant = participantMap.get(participantId);

      try {
        if (!participant) {
          // Create item for missing participant
          await prisma.bulkOperationItem.create({
            data: {
              operationId: operation.id,
              participantId,
              status: "error",
              errorMessage: "Participant not found",
              processedAt: new Date(),
            },
          });
          failureCount++;
          continue;
        }

        // Capture previous state
        const previousState = {
          status: participant.status,
          currentStepId: participant.currentStepId,
        };

        // Create BulkOperationItem with previousState
        const item = await prisma.bulkOperationItem.create({
          data: {
            operationId: operation.id,
            participantId,
            status: "processing",
            previousState: previousState as any,
          },
        });

        // Execute the workflow action (no expectedVersion for batch)
        await processWorkflowAction(
          participantId,
          ctx.userId,
          input.action as ApprovalAction,
          input.remarks,
        );

        // Mark success
        await prisma.bulkOperationItem.update({
          where: { id: item.id },
          data: { status: "success", processedAt: new Date() },
        });

        processedParticipantIds.push(participantId);
        successCount++;
      } catch (error: any) {
        logger.error(
          { error, participantId, operationId: operation.id },
          "Batch workflow action failed for participant",
        );

        // Try to mark the item as error (it may already exist)
        try {
          const existingItem = await prisma.bulkOperationItem.findFirst({
            where: { operationId: operation.id, participantId },
          });
          if (existingItem) {
            await prisma.bulkOperationItem.update({
              where: { id: existingItem.id },
              data: {
                status: "error",
                errorMessage: error.message ?? "Unknown error",
                processedAt: new Date(),
              },
            });
          } else {
            await prisma.bulkOperationItem.create({
              data: {
                operationId: operation.id,
                participantId,
                status: "error",
                errorMessage: error.message ?? "Unknown error",
                processedAt: new Date(),
              },
            });
          }
        } catch {
          // Swallow — don't let item tracking errors mask the real error
        }

        failureCount++;
      }
    }

    // Update progress after each batch
    await prisma.bulkOperation.update({
      where: { id: operation.id },
      data: {
        processedItems: successCount + failureCount,
        successCount,
        failureCount,
      },
    });
  }

  // Capture snapshot for undo
  if (processedParticipantIds.length > 0) {
    try {
      await captureSnapshot(operation.id, processedParticipantIds);
    } catch (error) {
      logger.error({ error, operationId: operation.id }, "Failed to capture batch action snapshot");
    }
  }

  // Finalize
  const undoDeadline = new Date();
  undoDeadline.setHours(undoDeadline.getHours() + UNDO_WINDOW_HOURS);

  const finalStatus = failureCount > 0 && successCount === 0 ? "FAILED" : "COMPLETED";

  await prisma.bulkOperation.update({
    where: { id: operation.id },
    data: {
      status: finalStatus as any,
      processedItems: successCount + failureCount,
      successCount,
      failureCount,
      completedAt: new Date(),
      undoDeadline,
    },
  });

  logger.info(
    { operationId: operation.id, action: input.action, successCount, failureCount },
    "Batch workflow action complete",
  );

  return {
    operationId: operation.id,
    totalItems: input.participantIds.length,
    successCount,
    failureCount,
    status: finalStatus,
  };
}

// ─── Dry Run ─────────────────────────────────────────────

export async function dryRunBatchAction(
  input: BatchActionInput,
  ctx: ServiceContext,
): Promise<DryRunResult> {
  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.BULK_OPERATIONS);
  if (!enabled) {
    throw new Error("Bulk operations feature is not enabled");
  }

  const result = await validateBatchEligibility(
    input.participantIds,
    input.action as ApprovalAction,
    ctx.tenantId,
  );

  return {
    eligible: result.eligible,
    ineligible: result.ineligible,
    totalCount: input.participantIds.length,
    eligibleCount: result.eligible.length,
    ineligibleCount: result.ineligible.length,
  };
}
