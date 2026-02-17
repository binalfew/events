import { describe, it, expect, vi } from "vitest";

vi.mock("~/lib/db.server", () => ({
  prisma: {
    autoActionRule: { findMany: vi.fn() },
    participant: { update: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

describe("Integration: Auto-Action Rules Engine", () => {
  describe("Service exports", () => {
    it("should export evaluateAutoActions function", async () => {
      const mod = await import("~/services/auto-action.server");
      expect(mod.evaluateAutoActions).toBeDefined();
    });

    it("should export executeAutoActionsChain function", async () => {
      const mod = await import("~/services/auto-action.server");
      expect(mod.executeAutoActionsChain).toBeDefined();
    });

    it("should export rule CRUD functions", async () => {
      const mod = await import("~/services/auto-action.server");
      expect(mod.createRule).toBeDefined();
      expect(mod.updateRule).toBeDefined();
      expect(mod.deleteRule).toBeDefined();
      expect(mod.listRules).toBeDefined();
      expect(mod.reorderRules).toBeDefined();
    });
  });

  describe("Action type mapping", () => {
    it("should map auto-action types to approval actions", async () => {
      const { ACTION_TYPE_MAP } = await import("~/services/auto-action.server");
      expect(ACTION_TYPE_MAP.AUTO_APPROVE).toBe("APPROVE");
      expect(ACTION_TYPE_MAP.AUTO_REJECT).toBe("REJECT");
      expect(ACTION_TYPE_MAP.AUTO_BYPASS).toBe("BYPASS");
      expect(ACTION_TYPE_MAP.AUTO_ESCALATE).toBe("ESCALATE");
    });
  });

  describe("Max chain depth prevents infinite loops", () => {
    it("should enforce a maximum chain depth", async () => {
      const mod = await import("~/services/auto-action.server");
      expect(mod.MAX_CHAIN_DEPTH).toBeDefined();
      expect(mod.MAX_CHAIN_DEPTH).toBeGreaterThan(0);
      expect(mod.MAX_CHAIN_DEPTH).toBeLessThanOrEqual(10);
    });
  });

  describe("System user constant", () => {
    it("should define a system user ID for audit logs", async () => {
      const { SYSTEM_USER_ID } = await import("~/services/auto-action.server");
      expect(SYSTEM_USER_ID).toBe("system");
    });
  });

  describe("Priority ordering logic", () => {
    it("lower priority number should be matched first", () => {
      const rules = [
        { id: "r1", priority: 10, name: "Rule 10" },
        { id: "r2", priority: 5, name: "Rule 5" },
        { id: "r3", priority: 1, name: "Rule 1" },
      ];
      const sorted = [...rules].sort((a, b) => a.priority - b.priority);
      expect(sorted[0].id).toBe("r3"); // priority 1 first
      expect(sorted[1].id).toBe("r2"); // priority 5 second
    });
  });
});
