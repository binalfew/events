import { describe, it, expect } from "vitest";
import {
  serializeWorkflow,
  deserializeWorkflow,
  computeWorkflowHash,
  WorkflowError,
} from "../serializer.server";

const makeStep = (overrides: Record<string, unknown> = {}) => ({
  id: "step-1",
  name: "Review",
  description: "Review step",
  order: 1,
  stepType: "REVIEW",
  isEntryPoint: true,
  isTerminal: false,
  nextStepId: "step-2",
  rejectionTargetId: null,
  bypassTargetId: null,
  escalationTargetId: null,
  slaDurationMinutes: null,
  slaAction: null,
  config: {},
  ...overrides,
});

const makeWorkflow = (overrides: Record<string, unknown> = {}) => ({
  id: "wf-1",
  name: "Accreditation",
  steps: [
    makeStep({ id: "step-2", order: 2, isEntryPoint: false, isTerminal: true, nextStepId: null }),
    makeStep({ id: "step-1", order: 1 }),
  ],
  ...overrides,
});

describe("serializer.server", () => {
  describe("serializeWorkflow", () => {
    it("serializes workflow preserving all step data", () => {
      const workflow = makeWorkflow({ steps: [makeStep()] });
      const snapshot = serializeWorkflow(workflow);

      expect(snapshot.id).toBe("wf-1");
      expect(snapshot.name).toBe("Accreditation");
      expect(snapshot.steps).toHaveLength(1);
      expect(snapshot.steps[0].id).toBe("step-1");
      expect(snapshot.steps[0].name).toBe("Review");
      expect(snapshot.steps[0].sortOrder).toBe(1);
      expect(snapshot.steps[0].isFinalStep).toBe(false);
      expect(snapshot.steps[0].isEntryPoint).toBe(true);
      expect(snapshot.steps[0].conditions).toEqual({});
      expect(snapshot.steps[0].slaWarningMinutes).toBeNull();
      expect(snapshot.steps[0].assignedRoleId).toBeNull();
    });

    it("sorts steps by order in snapshot", () => {
      const workflow = makeWorkflow();
      const snapshot = serializeWorkflow(workflow);

      expect(snapshot.steps[0].id).toBe("step-1");
      expect(snapshot.steps[0].sortOrder).toBe(1);
      expect(snapshot.steps[1].id).toBe("step-2");
      expect(snapshot.steps[1].sortOrder).toBe(2);
    });
  });

  describe("computeWorkflowHash", () => {
    it("is deterministic (same input produces same hash)", () => {
      const workflow = makeWorkflow();
      const hash1 = computeWorkflowHash(workflow);
      const hash2 = computeWorkflowHash(workflow);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("differs for different workflows", () => {
      const wf1 = makeWorkflow();
      const wf2 = makeWorkflow({ name: "Different Workflow" });

      expect(computeWorkflowHash(wf1)).not.toBe(computeWorkflowHash(wf2));
    });
  });

  describe("deserializeWorkflow", () => {
    it("deserializes and restores a valid snapshot", () => {
      const workflow = makeWorkflow();
      const snapshot = serializeWorkflow(workflow);
      const restored = deserializeWorkflow(snapshot);

      expect(restored.id).toBe(snapshot.id);
      expect(restored.name).toBe(snapshot.name);
      expect(restored.steps).toEqual(snapshot.steps);
    });

    it("parses a JSON string snapshot", () => {
      const workflow = makeWorkflow();
      const snapshot = serializeWorkflow(workflow);
      const json = JSON.stringify(snapshot);
      const restored = deserializeWorkflow(json);

      expect(restored.id).toBe(snapshot.id);
    });

    it("throws WorkflowError for invalid structure", () => {
      expect(() => deserializeWorkflow({})).toThrow(WorkflowError);
      expect(() => deserializeWorkflow({ id: "x" })).toThrow(WorkflowError);
      expect(() => deserializeWorkflow(null)).toThrow(WorkflowError);
    });
  });

  describe("WorkflowError", () => {
    it("has correct name and status", () => {
      const error = new WorkflowError("test error", 400);

      expect(error.name).toBe("WorkflowError");
      expect(error.message).toBe("test error");
      expect(error.status).toBe(400);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
