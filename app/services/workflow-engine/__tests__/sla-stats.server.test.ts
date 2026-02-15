import { describe, it, expect, vi, beforeEach } from "vitest";

const mockParticipantFindMany = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    participant: {
      findMany: mockParticipantFindMany,
    },
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function makeSnapshot(steps: Record<string, unknown>[] = []) {
  return {
    id: "wf-1",
    name: "Accreditation",
    steps:
      steps.length > 0
        ? steps
        : [
            {
              id: "step-1",
              name: "Review",
              description: null,
              sortOrder: 1,
              stepType: "REVIEW",
              isEntryPoint: true,
              isFinalStep: false,
              nextStepId: "step-2",
              rejectionTargetId: null,
              bypassTargetId: null,
              escalationTargetId: null,
              slaDurationMinutes: 60,
              slaAction: "NOTIFY",
              conditions: {},
              slaWarningMinutes: 15,
              assignedRoleId: null,
            },
          ],
  };
}

function makeParticipant(
  id: string,
  minutesAgo: number,
  stepOverrides: Record<string, unknown> = {},
) {
  const now = new Date();
  const enteredAt = new Date(now.getTime() - minutesAgo * 60 * 1000);
  return {
    id,
    currentStepId: "step-1",
    workflowVersionId: "v-1",
    createdAt: enteredAt,
    deletedAt: null,
    workflowVersion: {
      id: "v-1",
      snapshot: makeSnapshot([
        {
          id: "step-1",
          name: "Review",
          description: null,
          sortOrder: 1,
          stepType: "REVIEW",
          isEntryPoint: true,
          isFinalStep: false,
          nextStepId: "step-2",
          rejectionTargetId: null,
          bypassTargetId: null,
          escalationTargetId: null,
          slaDurationMinutes: 60,
          slaAction: "NOTIFY",
          conditions: {},
          slaWarningMinutes: 15,
          assignedRoleId: null,
          ...stepOverrides,
        },
      ]),
    },
    approvals: [{ createdAt: enteredAt }],
  };
}

describe("sla-stats.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSLAStats", () => {
    it("returns correct counts for within, warning, and breached", async () => {
      const { getSLAStats } = await import("../sla-stats.server");

      mockParticipantFindMany.mockResolvedValue([
        makeParticipant("p-within", 30), // 30 min ago → within SLA (60 min)
        makeParticipant("p-warning", 50), // 50 min ago → warning zone (60-15=45 threshold)
        makeParticipant("p-breached", 90), // 90 min ago → breached
      ]);

      const stats = await getSLAStats("wf-1");

      expect(stats.totalWithSLA).toBe(3);
      expect(stats.withinSLA).toBe(1);
      expect(stats.warningZone).toBe(1);
      expect(stats.breached).toBe(1);
    });

    it("calculates average time at step", async () => {
      const { getSLAStats } = await import("../sla-stats.server");

      mockParticipantFindMany.mockResolvedValue([
        makeParticipant("p-1", 30),
        makeParticipant("p-2", 50),
      ]);

      const stats = await getSLAStats("wf-1");

      expect(stats.averageTimeAtStep["step-1"]).toBe(40); // avg(30, 50) = 40
    });

    it("excludes participants without SLA config from SLA counts", async () => {
      const { getSLAStats } = await import("../sla-stats.server");

      mockParticipantFindMany.mockResolvedValue([
        makeParticipant("p-no-sla", 30, { slaDurationMinutes: null }),
      ]);

      const stats = await getSLAStats("wf-1");

      expect(stats.totalWithSLA).toBe(0);
      // But still tracked in averageTimeAtStep
      expect(stats.averageTimeAtStep["step-1"]).toBeDefined();
    });
  });

  describe("getOverdueParticipants", () => {
    it("returns breached participants sorted by urgency", async () => {
      const { getOverdueParticipants } = await import("../sla-stats.server");

      mockParticipantFindMany.mockResolvedValue([
        makeParticipant("p-less-overdue", 70), // 10 min overdue
        makeParticipant("p-more-overdue", 120), // 60 min overdue
      ]);

      const results = await getOverdueParticipants("wf-1", { onlyBreached: true });

      expect(results).toHaveLength(2);
      expect(results[0].participant.id).toBe("p-more-overdue");
      expect(results[0].status).toBe("breached");
      expect(results[1].participant.id).toBe("p-less-overdue");
    });

    it("includes warning participants when onlyBreached is false", async () => {
      const { getOverdueParticipants } = await import("../sla-stats.server");

      mockParticipantFindMany.mockResolvedValue([
        makeParticipant("p-warning", 50), // warning zone
        makeParticipant("p-breached", 90), // breached
      ]);

      const results = await getOverdueParticipants("wf-1");

      expect(results).toHaveLength(2);
      // Breached should come first
      expect(results[0].status).toBe("breached");
      expect(results[1].status).toBe("warning");
    });

    it("filters by stepId when provided", async () => {
      const { getOverdueParticipants } = await import("../sla-stats.server");

      mockParticipantFindMany.mockResolvedValue([makeParticipant("p-1", 90)]);

      await getOverdueParticipants("wf-1", { stepId: "step-1" });

      expect(mockParticipantFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentStepId: "step-1",
          }),
        }),
      );
    });

    it("returns empty when no participants are overdue", async () => {
      const { getOverdueParticipants } = await import("../sla-stats.server");

      mockParticipantFindMany.mockResolvedValue([
        makeParticipant("p-ok", 30), // 30 min → within SLA
      ]);

      const results = await getOverdueParticipants("wf-1");

      expect(results).toHaveLength(0);
    });
  });
});
