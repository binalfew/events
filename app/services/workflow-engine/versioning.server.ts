import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import {
  serializeWorkflow,
  deserializeWorkflow,
  computeWorkflowHash,
  WorkflowError,
} from "./serializer.server";
import type { WorkflowSnapshot } from "./serializer.server";

export async function ensureCurrentVersion(workflowId: string, userId: string) {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, deletedAt: null },
    include: {
      steps: true,
    },
  });

  if (!workflow) {
    throw new WorkflowError("Workflow not found", 404);
  }

  const hash = computeWorkflowHash(workflow);

  const latestVersion = await prisma.workflowVersion.findFirst({
    where: { workflowId },
    orderBy: { version: "desc" },
  });

  if (latestVersion && latestVersion.changeDescription === hash) {
    return latestVersion;
  }

  const nextVersion = (latestVersion?.version ?? 0) + 1;
  const snapshot = serializeWorkflow(workflow);

  const newVersion = await prisma.workflowVersion.create({
    data: {
      workflowId,
      version: nextVersion,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      changeDescription: hash,
      createdBy: userId,
    },
  });

  logger.info({ workflowId, version: nextVersion }, "Created workflow version");

  return newVersion;
}

export async function getParticipantVersion(participantId: string): Promise<WorkflowSnapshot> {
  const participant = await prisma.participant.findFirst({
    where: { id: participantId, deletedAt: null },
    select: {
      id: true,
      workflowId: true,
      workflowVersionId: true,
      workflowVersion: true,
    },
  });

  if (!participant) {
    throw new WorkflowError("Participant not found", 404);
  }

  if (participant.workflowVersionId && participant.workflowVersion) {
    return deserializeWorkflow(participant.workflowVersion.snapshot);
  }

  const version = await ensureCurrentVersion(participant.workflowId, "system");

  await prisma.participant.update({
    where: { id: participantId },
    data: { workflowVersionId: version.id },
  });

  return deserializeWorkflow(version.snapshot);
}

export async function publishWorkflowVersion(
  workflowId: string,
  userId: string,
  description?: string,
) {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, deletedAt: null },
    include: { steps: true },
  });

  if (!workflow) {
    throw new WorkflowError("Workflow not found", 404);
  }

  const latestVersion = await prisma.workflowVersion.findFirst({
    where: { workflowId },
    orderBy: { version: "desc" },
  });

  const nextVersion = (latestVersion?.version ?? 0) + 1;
  const snapshot = serializeWorkflow(workflow);

  const newVersion = await prisma.workflowVersion.create({
    data: {
      workflowId,
      version: nextVersion,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      changeDescription: description ?? null,
      createdBy: userId,
    },
  });

  logger.info({ workflowId, version: nextVersion }, "Published workflow version");

  return newVersion;
}

export async function listWorkflowVersions(workflowId: string) {
  const versions = await prisma.workflowVersion.findMany({
    where: { workflowId },
    orderBy: { version: "desc" },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  return versions.map((v) => ({
    id: v.id,
    version: v.version,
    createdAt: v.createdAt,
    participantCount: v._count.participants,
  }));
}

export async function compareVersions(versionId1: string, versionId2: string) {
  const [v1, v2] = await Promise.all([
    prisma.workflowVersion.findFirst({ where: { id: versionId1 } }),
    prisma.workflowVersion.findFirst({ where: { id: versionId2 } }),
  ]);

  if (!v1 || !v2) {
    throw new WorkflowError("One or both versions not found", 404);
  }

  const snapshot1 = deserializeWorkflow(v1.snapshot);
  const snapshot2 = deserializeWorkflow(v2.snapshot);

  const steps1Map = new Map(snapshot1.steps.map((s) => [s.id, s]));
  const steps2Map = new Map(snapshot2.steps.map((s) => [s.id, s]));

  const addedSteps = snapshot2.steps.filter((s) => !steps1Map.has(s.id));
  const removedSteps = snapshot1.steps.filter((s) => !steps2Map.has(s.id));
  const modifiedSteps = snapshot2.steps.filter((s) => {
    const old = steps1Map.get(s.id);
    if (!old) return false;
    return JSON.stringify(old) !== JSON.stringify(s);
  });

  return { addedSteps, removedSteps, modifiedSteps };
}
