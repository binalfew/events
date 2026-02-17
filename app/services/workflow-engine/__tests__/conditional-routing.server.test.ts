import { describe, it, expect } from "vitest";
import { evaluateConditionalRoutes, resolveNextStep } from "../navigation.server";
import type { StepSnapshot, ConditionalRoute } from "../serializer.server";

// ─── Helpers ──────────────────────────────────────────────

function makeStep(overrides: Partial<StepSnapshot> = {}): StepSnapshot {
  return {
    id: "step-1",
    name: "Review",
    description: null,
    sortOrder: 1,
    stepType: "REVIEW",
    isEntryPoint: true,
    isFinalStep: false,
    nextStepId: "step-default",
    rejectionTargetId: "step-reject-default",
    bypassTargetId: "step-bypass",
    escalationTargetId: "step-escalate",
    slaDurationMinutes: null,
    slaAction: null,
    conditions: {},
    slaWarningMinutes: null,
    assignedRoleId: null,
    ...overrides,
  };
}

function makeRoute(overrides: Partial<ConditionalRoute> = {}): ConditionalRoute {
  return {
    id: "route-1",
    condition: { type: "simple", field: "vip", operator: "eq", value: "true" },
    targetStepId: "step-vip",
    priority: 1,
    ...overrides,
  };
}

// ─── evaluateConditionalRoutes ────────────────────────────

describe("evaluateConditionalRoutes", () => {
  it("returns null when routes is undefined", () => {
    expect(evaluateConditionalRoutes(undefined, { vip: "true" })).toBeNull();
  });

  it("returns null when routes is empty", () => {
    expect(evaluateConditionalRoutes([], { vip: "true" })).toBeNull();
  });

  it("returns matching route target step ID", () => {
    const routes = [makeRoute()];
    expect(evaluateConditionalRoutes(routes, { vip: "true" })).toBe("step-vip");
  });

  it("returns null when no route condition matches", () => {
    const routes = [makeRoute()];
    expect(evaluateConditionalRoutes(routes, { vip: "false" })).toBeNull();
  });

  it("returns first matching route by priority (ascending)", () => {
    const routes = [
      makeRoute({
        id: "route-high",
        condition: { type: "simple", field: "status", operator: "eq", value: "VIP" },
        targetStepId: "step-high-priority",
        priority: 10,
      }),
      makeRoute({
        id: "route-low",
        condition: { type: "simple", field: "status", operator: "eq", value: "VIP" },
        targetStepId: "step-low-priority",
        priority: 1,
      }),
    ];

    // Both match, but priority 1 wins
    expect(evaluateConditionalRoutes(routes, { status: "VIP" })).toBe("step-low-priority");
  });

  it("skips non-matching routes and returns first match", () => {
    const routes = [
      makeRoute({
        id: "route-1",
        condition: { type: "simple", field: "nationality", operator: "eq", value: "US" },
        targetStepId: "step-us",
        priority: 1,
      }),
      makeRoute({
        id: "route-2",
        condition: { type: "simple", field: "vip", operator: "eq", value: "true" },
        targetStepId: "step-vip",
        priority: 2,
      }),
    ];

    expect(evaluateConditionalRoutes(routes, { nationality: "UK", vip: "true" })).toBe("step-vip");
  });

  it("evaluates compound AND conditions", () => {
    const routes: ConditionalRoute[] = [
      {
        id: "route-compound",
        condition: {
          type: "compound",
          operator: "and",
          conditions: [
            { type: "simple", field: "vip", operator: "eq", value: "true" },
            { type: "simple", field: "delegation_size", operator: "gt", value: 5 },
          ],
        },
        targetStepId: "step-vip-large",
        priority: 1,
      },
    ];

    // Both conditions met
    expect(evaluateConditionalRoutes(routes, { vip: "true", delegation_size: 10 })).toBe(
      "step-vip-large",
    );

    // Only one condition met
    expect(evaluateConditionalRoutes(routes, { vip: "true", delegation_size: 2 })).toBeNull();
  });

  it("evaluates compound OR conditions", () => {
    const routes: ConditionalRoute[] = [
      {
        id: "route-or",
        condition: {
          type: "compound",
          operator: "or",
          conditions: [
            { type: "simple", field: "nationality", operator: "eq", value: "US" },
            { type: "simple", field: "nationality", operator: "eq", value: "UK" },
          ],
        },
        targetStepId: "step-anglophone",
        priority: 1,
      },
    ];

    expect(evaluateConditionalRoutes(routes, { nationality: "UK" })).toBe("step-anglophone");
    expect(evaluateConditionalRoutes(routes, { nationality: "FR" })).toBeNull();
  });
});

// ─── resolveNextStep ──────────────────────────────────────

describe("resolveNextStep", () => {
  it("returns default nextStepId when conditional routing is disabled", () => {
    const step = makeStep({
      conditionalRoutes: [makeRoute()],
    });

    const result = resolveNextStep(step, "APPROVE", { vip: "true" }, false);
    expect(result).toBe("step-default");
  });

  it("returns conditional target for APPROVE when condition matches and routing enabled", () => {
    const step = makeStep({
      conditionalRoutes: [makeRoute()],
    });

    const result = resolveNextStep(step, "APPROVE", { vip: "true" }, true);
    expect(result).toBe("step-vip");
  });

  it("falls back to nextStepId when no conditional route matches", () => {
    const step = makeStep({
      conditionalRoutes: [makeRoute()],
    });

    const result = resolveNextStep(step, "APPROVE", { vip: "false" }, true);
    expect(result).toBe("step-default");
  });

  it("evaluates conditionalRoutes for PRINT action", () => {
    const step = makeStep({
      conditionalRoutes: [makeRoute()],
    });

    const result = resolveNextStep(step, "PRINT", { vip: "true" }, true);
    expect(result).toBe("step-vip");
  });

  it("evaluates rejectionConditionalRoutes for REJECT action", () => {
    const step = makeStep({
      rejectionConditionalRoutes: [
        makeRoute({
          id: "reject-route",
          condition: { type: "simple", field: "priority", operator: "eq", value: "high" },
          targetStepId: "step-reject-special",
          priority: 1,
        }),
      ],
    });

    const result = resolveNextStep(step, "REJECT", { priority: "high" }, true);
    expect(result).toBe("step-reject-special");
  });

  it("falls back to rejectionTargetId when no rejection condition matches", () => {
    const step = makeStep({
      rejectionConditionalRoutes: [
        makeRoute({
          id: "reject-route",
          condition: { type: "simple", field: "priority", operator: "eq", value: "high" },
          targetStepId: "step-reject-special",
          priority: 1,
        }),
      ],
    });

    const result = resolveNextStep(step, "REJECT", { priority: "low" }, true);
    expect(result).toBe("step-reject-default");
  });

  it("uses bypassTargetId for BYPASS (no conditional routing)", () => {
    const step = makeStep({
      conditionalRoutes: [makeRoute()],
    });

    const result = resolveNextStep(step, "BYPASS", { vip: "true" }, true);
    expect(result).toBe("step-bypass");
  });

  it("uses escalationTargetId for ESCALATE (no conditional routing)", () => {
    const step = makeStep({
      conditionalRoutes: [makeRoute()],
    });

    const result = resolveNextStep(step, "ESCALATE", { vip: "true" }, true);
    expect(result).toBe("step-escalate");
  });

  it("returns null for RETURN action (handled separately)", () => {
    const step = makeStep();

    const result = resolveNextStep(step, "RETURN", {}, true);
    expect(result).toBeNull();
  });

  it("returns default route when no conditional routes are defined", () => {
    const step = makeStep(); // no conditionalRoutes

    const result = resolveNextStep(step, "APPROVE", { vip: "true" }, true);
    expect(result).toBe("step-default");
  });
});
