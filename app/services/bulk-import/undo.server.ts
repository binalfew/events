import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";

const BATCH_SIZE = 50;

// ─── Capture snapshot ────────────────────────────────────

export async function captureSnapshot(
  operationId: string,
  participantIds: string[],
): Promise<void> {
  if (participantIds.length === 0) return;

  const participants = await prisma.participant.findMany({
    where: { id: { in: participantIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      organization: true,
      jobTitle: true,
      nationality: true,
      registrationCode: true,
      status: true,
      currentStepId: true,
      extras: true,
      participantTypeId: true,
      workflowId: true,
    },
  });

  const participantMap = new Map(participants.map((p) => [p.id, p]));

  // Store per-item previousState
  const items = await prisma.bulkOperationItem.findMany({
    where: { operationId, participantId: { in: participantIds } },
    select: { id: true, participantId: true },
  });

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((item) => {
        const state = item.participantId ? participantMap.get(item.participantId) : null;
        if (!state) return Promise.resolve();
        return prisma.bulkOperationItem.update({
          where: { id: item.id },
          data: { previousState: state as any },
        });
      }),
    );
  }

  // Store summary in operation
  await prisma.bulkOperation.update({
    where: { id: operationId },
    data: {
      snapshotData: {
        capturedAt: new Date().toISOString(),
        participantCount: participantIds.length,
      },
    },
  });

  logger.info({ operationId, count: participantIds.length }, "Snapshot captured");
}

// ─── Restore from snapshot ───────────────────────────────

export async function restoreFromSnapshot(operationId: string): Promise<{
  restoredCount: number;
  failedCount: number;
}> {
  const operation = await prisma.bulkOperation.findUnique({
    where: { id: operationId },
    select: { type: true },
  });
  if (!operation) throw new Error("Operation not found");

  const items = await prisma.bulkOperationItem.findMany({
    where: { operationId, status: "success" },
    select: { id: true, participantId: true, previousState: true },
  });

  let restoredCount = 0;
  let failedCount = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (item) => {
        try {
          if (!item.participantId) {
            failedCount++;
            return;
          }

          if (operation.type === "IMPORT_PARTICIPANTS") {
            // Undo import: delete the created participant
            await prisma.participant.delete({
              where: { id: item.participantId },
            });
          } else if (item.previousState) {
            // Undo status change / field update: restore previous state
            const prev = item.previousState as Record<string, unknown>;
            await prisma.participant.update({
              where: { id: item.participantId },
              data: {
                firstName: prev.firstName as string,
                lastName: prev.lastName as string,
                email: (prev.email as string) ?? null,
                organization: (prev.organization as string) ?? null,
                jobTitle: (prev.jobTitle as string) ?? null,
                nationality: (prev.nationality as string) ?? null,
                status: prev.status as any,
                currentStepId: (prev.currentStepId as string) ?? null,
                extras: prev.extras as any,
              },
            });
          }

          restoredCount++;
        } catch (error) {
          logger.error({ error, itemId: item.id }, "Failed to restore item");
          failedCount++;
        }
      }),
    );
  }

  logger.info({ operationId, restoredCount, failedCount }, "Snapshot restore complete");
  return { restoredCount, failedCount };
}
