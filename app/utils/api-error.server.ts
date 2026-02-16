import {
  ConflictError,
  PreconditionRequiredError,
  NotFoundError,
  isPrismaNotFoundError,
} from "~/services/optimistic-lock.server";
import { FieldError } from "~/services/fields.server";
import { FormTemplateError } from "~/services/form-templates.server";
import { WorkflowError } from "~/services/workflow-engine/serializer.server";

export function formatErrorResponse(error: unknown): Response {
  if (error instanceof ConflictError) {
    return Response.json(
      {
        error: error.code,
        message: error.message,
        currentVersion: (error.currentResource as { updatedAt?: Date })?.updatedAt
          ? new Date((error.currentResource as { updatedAt: Date }).updatedAt).toISOString()
          : null,
        current: error.currentResource,
      },
      { status: 409 },
    );
  }

  if (error instanceof PreconditionRequiredError) {
    return Response.json({ error: error.code, message: error.message }, { status: 428 });
  }

  if (error instanceof NotFoundError) {
    return Response.json({ error: error.code, message: error.message }, { status: 404 });
  }

  if (error instanceof FieldError) {
    return Response.json(
      { error: "FIELD_ERROR", message: error.message },
      { status: error.status },
    );
  }

  if (error instanceof FormTemplateError) {
    return Response.json(
      { error: "FORM_TEMPLATE_ERROR", message: error.message },
      { status: error.status },
    );
  }

  if (error instanceof WorkflowError) {
    return Response.json(
      { error: "WORKFLOW_ERROR", message: error.message },
      { status: error.status },
    );
  }

  if (isPrismaNotFoundError(error)) {
    return Response.json(
      {
        error: "CONFLICT",
        message: "Resource was modified or deleted by another user",
      },
      { status: 409 },
    );
  }

  return Response.json(
    { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    { status: 500 },
  );
}
