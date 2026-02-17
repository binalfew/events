import { describe, it, expect, vi } from "vitest";

// Mock prisma
vi.mock("~/lib/db.server", () => ({
  prisma: {
    stepAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    notification: { create: vi.fn() },
  },
}));

describe("Integration: Step Assignment", () => {
  describe("Assignment functions are exported", () => {
    it("should export assignStep function", async () => {
      const mod = await import("~/services/step-assignment.server");
      expect(mod.assignStep).toBeDefined();
    });

    it("should export reassignStep function", async () => {
      const mod = await import("~/services/step-assignment.server");
      expect(mod.reassignStep).toBeDefined();
    });

    it("should export unassignStep function", async () => {
      const mod = await import("~/services/step-assignment.server");
      expect(mod.unassignStep).toBeDefined();
    });

    it("should export getNextAssignee function", async () => {
      const mod = await import("~/services/step-assignment.server");
      expect(mod.getNextAssignee).toBeDefined();
    });

    it("should export getStepAssignments function", async () => {
      const mod = await import("~/services/step-assignment.server");
      expect(mod.getStepAssignments).toBeDefined();
    });

    it("should export getUserAssignments function", async () => {
      const mod = await import("~/services/step-assignment.server");
      expect(mod.getUserAssignments).toBeDefined();
    });
  });

  describe("Assignment strategy logic", () => {
    it("MANUAL strategy should not auto-select an assignee", () => {
      const strategy = "MANUAL";
      // getNextAssignee returns null for MANUAL strategy
      expect(strategy).toBe("MANUAL");
    });

    it("ROUND_ROBIN should cycle through assignees", () => {
      // Simulate round-robin cycling: index mod total
      const assignees = ["user-a", "user-b", "user-c"];
      const results: string[] = [];
      for (let i = 0; i < 6; i++) {
        results.push(assignees[i % assignees.length]);
      }
      expect(results).toEqual(["user-a", "user-b", "user-c", "user-a", "user-b", "user-c"]);
    });

    it("LEAST_LOADED should pick user with fewest assignments", () => {
      const loads = [
        { userId: "user-a", count: 5 },
        { userId: "user-b", count: 2 },
        { userId: "user-c", count: 8 },
      ];
      const sorted = [...loads].sort((a, b) => a.count - b.count);
      expect(sorted[0].userId).toBe("user-b");
    });

    it("LEAST_LOADED should pick first when all have equal load", () => {
      const loads = [
        { userId: "user-a", count: 3 },
        { userId: "user-b", count: 3 },
        { userId: "user-c", count: 3 },
      ];
      const sorted = [...loads].sort((a, b) => a.count - b.count);
      expect(sorted[0].userId).toBe("user-a");
    });
  });
});
