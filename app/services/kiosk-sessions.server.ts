import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";

// ─── Service Functions ────────────────────────────────────

export async function startSession(deviceId: string, sessionType: string, language: string) {
  const session = await prisma.kioskSession.create({
    data: {
      kioskDeviceId: deviceId,
      sessionType,
      language,
      startedAt: new Date(),
    },
  });

  logger.info({ sessionId: session.id, deviceId }, "Kiosk session started");
  return session;
}

export async function endSession(sessionId: string, timedOut: boolean = false) {
  const session = await prisma.kioskSession.update({
    where: { id: sessionId },
    data: {
      endedAt: new Date(),
      timedOut,
    },
  });

  logger.info({ sessionId, timedOut }, "Kiosk session ended");
  return session;
}

export async function getActiveSession(deviceId: string) {
  return prisma.kioskSession.findFirst({
    where: {
      kioskDeviceId: deviceId,
      endedAt: null,
    },
    orderBy: { startedAt: "desc" },
  });
}

export async function getDeviceStats(deviceId: string, dateRange?: { start: Date; end: Date }) {
  const where: Record<string, unknown> = { kioskDeviceId: deviceId };
  if (dateRange) {
    where.startedAt = { gte: dateRange.start, lte: dateRange.end };
  }

  const sessions = await prisma.kioskSession.findMany({
    where: where as any,
    select: {
      sessionType: true,
      startedAt: true,
      endedAt: true,
      timedOut: true,
    },
  });

  const totalSessions = sessions.length;
  let totalDuration = 0;
  let timedOutCount = 0;
  const sessionsByType: Record<string, number> = {};

  for (const session of sessions) {
    if (session.endedAt) {
      totalDuration += session.endedAt.getTime() - session.startedAt.getTime();
    }
    if (session.timedOut) timedOutCount++;
    sessionsByType[session.sessionType] = (sessionsByType[session.sessionType] ?? 0) + 1;
  }

  const avgDurationSeconds =
    totalSessions > 0 ? Math.round(totalDuration / totalSessions / 1000) : 0;

  return {
    totalSessions,
    avgDurationSeconds,
    sessionsByType,
    timedOutCount,
  };
}
