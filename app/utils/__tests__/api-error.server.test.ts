import { describe, it, expect, vi } from "vitest";

vi.mock("~/lib/db.server", () => ({
  prisma: {},
}));

vi.mock("~/lib/logger.server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("~/lib/env.server", () => ({
  env: { BCRYPT_ROUNDS: 10 },
}));

import { formatErrorResponse } from "../api-error.server";
import {
  ConflictError,
  PreconditionRequiredError,
  NotFoundError,
} from "~/services/optimistic-lock.server";
import { FieldError } from "~/services/fields.server";
import { WorkflowError } from "~/services/workflow-engine/serializer.server";

describe("api-error.server", () => {
  describe("formatErrorResponse", () => {
    it("formats ConflictError as 409 with current resource", async () => {
      const error = new ConflictError("Modified", {
        id: "r-1",
        updatedAt: new Date("2026-02-15T10:00:00.000Z"),
      });

      const response = formatErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toBe("CONFLICT");
      expect(body.current).toBeDefined();
      expect(body.currentVersion).toBe("2026-02-15T10:00:00.000Z");
    });

    it("formats PreconditionRequiredError as 428", async () => {
      const error = new PreconditionRequiredError("Version required");

      const response = formatErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(428);
      expect(body.error).toBe("PRECONDITION_REQUIRED");
    });

    it("formats NotFoundError as 404", async () => {
      const error = new NotFoundError("Not found");

      const response = formatErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("NOT_FOUND");
    });

    it("formats FieldError with its status", async () => {
      const error = new FieldError("Field issue", 422);

      const response = formatErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.error).toBe("FIELD_ERROR");
    });

    it("formats WorkflowError with its status", async () => {
      const error = new WorkflowError("Workflow issue", 400);

      const response = formatErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("WORKFLOW_ERROR");
    });

    it("formats Prisma P2025 as 409 conflict", async () => {
      const error = { code: "P2025", message: "Record not found" };

      const response = formatErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toBe("CONFLICT");
    });

    it("formats unknown errors as 500", async () => {
      const error = new Error("Something broke");

      const response = formatErrorResponse(error);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("INTERNAL_ERROR");
    });
  });
});
