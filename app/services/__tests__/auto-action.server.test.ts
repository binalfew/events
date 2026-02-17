import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────

const mockRuleFindMany = vi.fn();
const mockRuleCreate = vi.fn();
const mockRuleUpdate = vi.fn();
const mockRuleDelete = vi.fn();
const mockAuditCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("~/lib/db.server", () => ({
  prisma: {
    autoActionRule: {
      findMany: (...args: unknown[]) => mockRuleFindMany(...args),
      create: (...args: unknown[]) => mockRuleCreate(...args),
      update: (...args: unknown[]) => mockRuleUpdate(...args),
      delete: (...args: unknown[]) => mockRuleDelete(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock processWorkflowAction for chain tests
const mockProcessWorkflowAction = vi.fn();
vi.mock("~/services/workflow-engine/navigation.server", () => ({
  processWorkflowAction: (...args: unknown[]) => mockProcessWorkflowAction(...args),
}));

// ─── Tests ───────────────────────────────────────────────

describe("auto-action.server", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("evaluateAutoActions", () => {
    it("returns null when no rules exist", async () => {
      const { evaluateAutoActions } = await import("../auto-action.server");
      mockRuleFindMany.mockResolvedValue([]);

      const result = await evaluateAutoActions("step-1", { vip: "true" });
      expect(result).toBeNull();
    });

    it("returns first matching rule by priority", async () => {
      const { evaluateAutoActions } = await import("../auto-action.server");

      mockRuleFindMany.mockResolvedValue([
        {
          id: "rule-1",
          name: "VIP Auto-Approve",
          actionType: "AUTO_APPROVE",
          priority: 1,
          conditionExpression: { type: "simple", field: "vip", operator: "eq", value: "true" },
        },
        {
          id: "rule-2",
          name: "Fallback Reject",
          actionType: "AUTO_REJECT",
          priority: 2,
          conditionExpression: {
            type: "simple",
            field: "status",
            operator: "eq",
            value: "INCOMPLETE",
          },
        },
      ]);

      const result = await evaluateAutoActions("step-1", { vip: "true", status: "INCOMPLETE" });

      expect(result).toEqual({
        ruleId: "rule-1",
        ruleName: "VIP Auto-Approve",
        actionType: "AUTO_APPROVE",
        approvalAction: "APPROVE",
      });
    });

    it("skips non-matching rules and returns next match", async () => {
      const { evaluateAutoActions } = await import("../auto-action.server");

      mockRuleFindMany.mockResolvedValue([
        {
          id: "rule-1",
          name: "No Match",
          actionType: "AUTO_APPROVE",
          priority: 1,
          conditionExpression: { type: "simple", field: "vip", operator: "eq", value: "true" },
        },
        {
          id: "rule-2",
          name: "Match",
          actionType: "AUTO_REJECT",
          priority: 2,
          conditionExpression: {
            type: "simple",
            field: "status",
            operator: "eq",
            value: "INCOMPLETE",
          },
        },
      ]);

      const result = await evaluateAutoActions("step-1", { vip: "false", status: "INCOMPLETE" });

      expect(result?.ruleId).toBe("rule-2");
      expect(result?.approvalAction).toBe("REJECT");
    });

    it("returns null when no rules match", async () => {
      const { evaluateAutoActions } = await import("../auto-action.server");

      mockRuleFindMany.mockResolvedValue([
        {
          id: "rule-1",
          name: "VIP Only",
          actionType: "AUTO_APPROVE",
          priority: 1,
          conditionExpression: { type: "simple", field: "vip", operator: "eq", value: "true" },
        },
      ]);

      const result = await evaluateAutoActions("step-1", { vip: "false" });
      expect(result).toBeNull();
    });

    it("maps AUTO_BYPASS to BYPASS action", async () => {
      const { evaluateAutoActions } = await import("../auto-action.server");

      mockRuleFindMany.mockResolvedValue([
        {
          id: "rule-1",
          name: "Skip",
          actionType: "AUTO_BYPASS",
          priority: 1,
          conditionExpression: { type: "simple", field: "skip", operator: "eq", value: "true" },
        },
      ]);

      const result = await evaluateAutoActions("step-1", { skip: "true" });
      expect(result?.approvalAction).toBe("BYPASS");
    });

    it("maps AUTO_ESCALATE to ESCALATE action", async () => {
      const { evaluateAutoActions } = await import("../auto-action.server");

      mockRuleFindMany.mockResolvedValue([
        {
          id: "rule-1",
          name: "Escalate",
          actionType: "AUTO_ESCALATE",
          priority: 1,
          conditionExpression: { type: "simple", field: "urgent", operator: "eq", value: "true" },
        },
      ]);

      const result = await evaluateAutoActions("step-1", { urgent: "true" });
      expect(result?.approvalAction).toBe("ESCALATE");
    });

    it("evaluates compound conditions", async () => {
      const { evaluateAutoActions } = await import("../auto-action.server");

      mockRuleFindMany.mockResolvedValue([
        {
          id: "rule-1",
          name: "VIP + Large Delegation",
          actionType: "AUTO_APPROVE",
          priority: 1,
          conditionExpression: {
            type: "compound",
            operator: "and",
            conditions: [
              { type: "simple", field: "vip", operator: "eq", value: "true" },
              { type: "simple", field: "delegation_size", operator: "gt", value: 5 },
            ],
          },
        },
      ]);

      // Both conditions met
      const result1 = await evaluateAutoActions("step-1", { vip: "true", delegation_size: 10 });
      expect(result1?.ruleId).toBe("rule-1");

      // Only one condition met
      const result2 = await evaluateAutoActions("step-1", { vip: "true", delegation_size: 2 });
      expect(result2).toBeNull();
    });
  });

  describe("executeAutoActionsChain", () => {
    it("returns null when no rules match", async () => {
      const { executeAutoActionsChain } = await import("../auto-action.server");
      mockRuleFindMany.mockResolvedValue([]);

      const result = await executeAutoActionsChain("p-1", "step-1", {}, false);
      expect(result).toBeNull();
    });

    it("executes a single auto-action", async () => {
      const { executeAutoActionsChain } = await import("../auto-action.server");

      // First call: rules for step-1
      mockRuleFindMany.mockResolvedValueOnce([
        {
          id: "rule-1",
          name: "VIP Approve",
          actionType: "AUTO_APPROVE",
          priority: 1,
          conditionExpression: { type: "simple", field: "vip", operator: "eq", value: "true" },
        },
      ]);

      mockProcessWorkflowAction.mockResolvedValue({
        previousStepId: "step-1",
        nextStepId: "step-2",
        isComplete: false,
      });

      mockAuditCreate.mockResolvedValue({});

      // Second call: rules for step-2 (no rules)
      mockRuleFindMany.mockResolvedValueOnce([]);

      const result = await executeAutoActionsChain("p-1", "step-1", { vip: "true" }, false);

      expect(result).not.toBeNull();
      expect(result!.actionsExecuted).toHaveLength(1);
      expect(result!.actionsExecuted[0].ruleName).toBe("VIP Approve");
      expect(mockProcessWorkflowAction).toHaveBeenCalledWith(
        "p-1",
        "system",
        "APPROVE",
        "Auto-action: VIP Approve",
        undefined,
        false,
      );
    });

    it("chains auto-actions across steps", async () => {
      const { executeAutoActionsChain } = await import("../auto-action.server");

      // Step-1 rules
      mockRuleFindMany.mockResolvedValueOnce([
        {
          id: "rule-1",
          name: "Auto-Approve Step 1",
          actionType: "AUTO_APPROVE",
          priority: 1,
          conditionExpression: { type: "simple", field: "auto", operator: "eq", value: "true" },
        },
      ]);

      mockProcessWorkflowAction.mockResolvedValueOnce({
        previousStepId: "step-1",
        nextStepId: "step-2",
        isComplete: false,
      });
      mockAuditCreate.mockResolvedValue({});

      // Step-2 rules
      mockRuleFindMany.mockResolvedValueOnce([
        {
          id: "rule-2",
          name: "Auto-Approve Step 2",
          actionType: "AUTO_APPROVE",
          priority: 1,
          conditionExpression: { type: "simple", field: "auto", operator: "eq", value: "true" },
        },
      ]);

      mockProcessWorkflowAction.mockResolvedValueOnce({
        previousStepId: "step-2",
        nextStepId: null,
        isComplete: true,
      });

      // Step after step-2: no more rules (complete)
      mockRuleFindMany.mockResolvedValueOnce([]);

      const result = await executeAutoActionsChain("p-1", "step-1", { auto: "true" }, false);

      expect(result).not.toBeNull();
      expect(result!.actionsExecuted).toHaveLength(2);
      expect(result!.isComplete).toBe(true);
      expect(result!.chainDepth).toBe(2);
    });

    it("stops at MAX_CHAIN_DEPTH to prevent infinite loops", async () => {
      const { executeAutoActionsChain, MAX_CHAIN_DEPTH } = await import("../auto-action.server");

      // Every call returns a matching rule that moves to next step
      mockRuleFindMany.mockResolvedValue([
        {
          id: "rule-loop",
          name: "Always Match",
          actionType: "AUTO_APPROVE",
          priority: 1,
          conditionExpression: { type: "simple", field: "x", operator: "eq", value: "1" },
        },
      ]);

      mockProcessWorkflowAction.mockResolvedValue({
        previousStepId: "step-a",
        nextStepId: "step-b",
        isComplete: false,
      });
      mockAuditCreate.mockResolvedValue({});

      // Start near the limit
      const result = await executeAutoActionsChain(
        "p-1",
        "step-1",
        { x: "1" },
        false,
        MAX_CHAIN_DEPTH,
      );

      expect(result).toBeNull();
    });

    it("stops chaining when workflow completes", async () => {
      const { executeAutoActionsChain } = await import("../auto-action.server");

      mockRuleFindMany.mockResolvedValueOnce([
        {
          id: "rule-1",
          name: "Final Approve",
          actionType: "AUTO_APPROVE",
          priority: 1,
          isActive: true,
          conditionExpression: { type: "simple", field: "ok", operator: "eq", value: "true" },
        },
      ]);

      mockProcessWorkflowAction.mockResolvedValueOnce({
        previousStepId: "step-final",
        nextStepId: null,
        isComplete: true,
      });
      mockAuditCreate.mockResolvedValue({});

      const result = await executeAutoActionsChain("p-1", "step-final", { ok: "true" }, false);

      expect(result).not.toBeNull();
      expect(result!.isComplete).toBe(true);
      expect(result!.actionsExecuted).toHaveLength(1);
    });

    it("creates audit log for each auto-action", async () => {
      const { executeAutoActionsChain } = await import("../auto-action.server");

      mockRuleFindMany
        .mockResolvedValueOnce([
          {
            id: "rule-1",
            name: "Test Rule",
            actionType: "AUTO_APPROVE",
            priority: 1,
            isActive: true,
            conditionExpression: { type: "simple", field: "go", operator: "eq", value: "true" },
          },
        ])
        .mockResolvedValueOnce([]);

      mockProcessWorkflowAction.mockResolvedValueOnce({
        previousStepId: "step-1",
        nextStepId: "step-2",
        isComplete: false,
      });
      mockAuditCreate.mockResolvedValue({});

      await executeAutoActionsChain("p-1", "step-1", { go: "true" }, false);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "system",
          entityId: "p-1",
          description: expect.stringContaining("Test Rule"),
          metadata: expect.objectContaining({
            ruleId: "rule-1",
            autoAction: true,
          }),
        }),
      });
    });
  });

  describe("CRUD operations", () => {
    it("createRule creates a rule", async () => {
      const { createRule } = await import("../auto-action.server");
      mockRuleCreate.mockResolvedValue({ id: "rule-1", actionType: "AUTO_APPROVE" });

      const result = await createRule("step-1", {
        name: "Test Rule",
        conditionExpression: { type: "simple", field: "vip", operator: "eq", value: "true" },
        actionType: "AUTO_APPROVE",
      });

      expect(result.id).toBe("rule-1");
      expect(mockRuleCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stepId: "step-1",
          name: "Test Rule",
          actionType: "AUTO_APPROVE",
        }),
      });
    });

    it("deleteRule removes a rule", async () => {
      const { deleteRule } = await import("../auto-action.server");
      mockRuleDelete.mockResolvedValue({});

      await deleteRule("rule-1");

      expect(mockRuleDelete).toHaveBeenCalledWith({ where: { id: "rule-1" } });
    });

    it("listRules returns rules ordered by priority", async () => {
      const { listRules } = await import("../auto-action.server");
      mockRuleFindMany.mockResolvedValueOnce([
        { id: "rule-1", priority: 0 },
        { id: "rule-2", priority: 1 },
      ]);

      const result = await listRules("step-1");

      expect(result).toHaveLength(2);
      expect(mockRuleFindMany).toHaveBeenLastCalledWith({
        where: { stepId: "step-1" },
        orderBy: { priority: "asc" },
      });
    });

    it("reorderRules updates priorities in a transaction", async () => {
      const { reorderRules } = await import("../auto-action.server");
      mockTransaction.mockResolvedValue([]);

      await reorderRules("step-1", ["rule-b", "rule-a", "rule-c"]);

      // $transaction receives a single array argument
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      const arg = mockTransaction.mock.calls[0][0];
      expect(arg).toHaveLength(3);
    });
  });
});
