import { describe, it, expect } from "vitest";

describe("Integration: Conditional Routing", () => {
  describe("Condition evaluation", () => {
    it("should evaluate simple equality condition", async () => {
      const { evaluateCondition } = await import("~/lib/condition-evaluator");
      const result = evaluateCondition(
        { type: "simple", field: "status", operator: "eq", value: "VIP" },
        { status: "VIP" },
      );
      expect(result).toBe(true);
    });

    it("should return false when condition does not match", async () => {
      const { evaluateCondition } = await import("~/lib/condition-evaluator");
      const result = evaluateCondition(
        { type: "simple", field: "status", operator: "eq", value: "VIP" },
        { status: "REGULAR" },
      );
      expect(result).toBe(false);
    });

    it("should evaluate 'contains' operator", async () => {
      const { evaluateCondition } = await import("~/lib/condition-evaluator");
      const result = evaluateCondition(
        { type: "simple", field: "name", operator: "contains", value: "John" },
        { name: "John Doe" },
      );
      expect(result).toBe(true);
    });

    it("should evaluate 'gt' for numbers", async () => {
      const { evaluateCondition } = await import("~/lib/condition-evaluator");
      const result = evaluateCondition(
        { type: "simple", field: "age", operator: "gt", value: "18" },
        { age: 25 },
      );
      expect(result).toBe(true);
    });

    it("should evaluate compound AND conditions", async () => {
      const { evaluateCondition } = await import("~/lib/condition-evaluator");
      const result = evaluateCondition(
        {
          type: "compound",
          operator: "and",
          conditions: [
            { type: "simple", field: "vip", operator: "eq", value: "true" },
            { type: "simple", field: "country", operator: "eq", value: "US" },
          ],
        },
        { vip: "true", country: "US" },
      );
      expect(result).toBe(true);
    });

    it("should evaluate compound OR conditions", async () => {
      const { evaluateCondition } = await import("~/lib/condition-evaluator");
      const result = evaluateCondition(
        {
          type: "compound",
          operator: "or",
          conditions: [
            { type: "simple", field: "vip", operator: "eq", value: "true" },
            { type: "simple", field: "country", operator: "eq", value: "UK" },
          ],
        },
        { vip: "false", country: "UK" },
      );
      expect(result).toBe(true);
    });

    it("should return false for AND when one condition fails", async () => {
      const { evaluateCondition } = await import("~/lib/condition-evaluator");
      const result = evaluateCondition(
        {
          type: "compound",
          operator: "and",
          conditions: [
            { type: "simple", field: "vip", operator: "eq", value: "true" },
            { type: "simple", field: "country", operator: "eq", value: "US" },
          ],
        },
        { vip: "true", country: "UK" },
      );
      expect(result).toBe(false);
    });
  });

  describe("Undefined condition returns true", () => {
    it("should return true for undefined condition", async () => {
      const { evaluateCondition } = await import("~/lib/condition-evaluator");
      const result = evaluateCondition(undefined, { status: "VIP" });
      expect(result).toBe(true);
    });
  });

  describe("Default route fallback", () => {
    it("should use default when no conditions match", async () => {
      const { evaluateCondition } = await import("~/lib/condition-evaluator");
      const conditions = [
        { type: "simple" as const, field: "status", operator: "eq" as const, value: "VIP" },
        { type: "simple" as const, field: "status", operator: "eq" as const, value: "PRESS" },
      ];
      const data = { status: "REGULAR" };

      const anyMatch = conditions.some((c) => evaluateCondition(c, data));
      expect(anyMatch).toBe(false);
      // Default route should be used
    });
  });

  describe("Priority ordering", () => {
    it("should evaluate conditions in order and pick first match", async () => {
      const { evaluateCondition } = await import("~/lib/condition-evaluator");
      const conditions = [
        {
          type: "simple" as const,
          field: "vip",
          operator: "eq" as const,
          value: "true",
          targetStep: "fast-track",
        },
        {
          type: "simple" as const,
          field: "country",
          operator: "eq" as const,
          value: "US",
          targetStep: "us-review",
        },
      ];
      const data = { vip: "true", country: "US" };

      let matchedStep: string | null = null;
      for (const c of conditions) {
        if (evaluateCondition(c, data)) {
          matchedStep = c.targetStep;
          break;
        }
      }
      expect(matchedStep).toBe("fast-track"); // first match wins
    });
  });

  describe("Operator metadata", () => {
    it("should return operators for TEXT type", async () => {
      const { getOperatorsForType } = await import("~/lib/condition-evaluator");
      const ops = getOperatorsForType("TEXT");
      expect(ops.length).toBeGreaterThan(0);
      const values = ops.map((o) => o.value);
      expect(values).toContain("eq");
      expect(values).toContain("contains");
    });

    it("should return numeric operators for NUMBER type", async () => {
      const { getOperatorsForType } = await import("~/lib/condition-evaluator");
      const ops = getOperatorsForType("NUMBER");
      const values = ops.map((o) => o.value);
      expect(values).toContain("gt");
      expect(values).toContain("lt");
    });
  });
});
