import { useForm, getFormProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { data, Form, useActionData, useLoaderData } from "react-router";
import { requireAuth } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { listDynamicFields } from "~/services/dynamic-fields.server";
import { parseDynamicFormData } from "~/lib/dynamic-fields.server";
import { buildDynamicDataSchema } from "~/lib/dynamic-fields";
import { DynamicFieldSection } from "~/components/dynamic-fields";
import { Button } from "~/components/ui/button";
import type { Route } from "./+types/test-dynamic-form";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireAuth(request);
  const tenantId = user.tenantId;

  if (!tenantId) {
    return { fieldDefs: [], eventId: null, eventName: null };
  }

  // Find the first event for this tenant
  const event = await prisma.event.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });

  if (!event) {
    return { fieldDefs: [], eventId: null, eventName: null };
  }

  const fieldDefs = await listDynamicFields(tenantId, {
    eventId: event.id,
  });

  return { fieldDefs, eventId: event.id, eventName: event.name };
}

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requireAuth(request);
  const tenantId = user.tenantId;

  if (!tenantId) {
    return data({ success: false, errors: ["No tenant assigned"] }, { status: 400 });
  }

  const event = await prisma.event.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });

  if (!event) {
    return data({ success: false, errors: ["No event found"] }, { status: 400 });
  }

  const fieldDefs = await listDynamicFields(tenantId, {
    eventId: event.id,
  });

  const formData = await request.formData();
  const parsed = parseDynamicFormData(formData, fieldDefs);

  const schema = buildDynamicDataSchema(fieldDefs);
  const submission = parseWithZod(createFormDataFromParsed(parsed, fieldDefs), { schema });

  if (submission.status !== "success") {
    return data(submission.reply(), { status: 400 });
  }

  return data({ success: true, data: submission.value });
}

/**
 * Re-create FormData from parsed values so parseWithZod can process it.
 * This bridges parseDynamicFormData's type coercion with Conform's validation.
 */
function createFormDataFromParsed(
  parsed: Record<string, unknown>,
  fieldDefs: Array<{ name: string; dataType: string }>,
): FormData {
  const fd = new FormData();
  for (const field of fieldDefs) {
    const val = parsed[field.name];
    if (val === undefined || val === null) continue;

    if (Array.isArray(val)) {
      for (const item of val) {
        fd.append(field.name, String(item));
      }
    } else {
      fd.set(field.name, String(val));
    }
  }
  return fd;
}

export default function TestDynamicFormPage({ loaderData, actionData }: Route.ComponentProps) {
  const { fieldDefs, eventName } = loaderData;

  const schema = fieldDefs.length > 0 ? buildDynamicDataSchema(fieldDefs) : undefined;

  const [form] = useForm({
    lastResult: actionData && "status" in actionData ? actionData : undefined,
    onValidate: schema ? ({ formData }) => parseWithZod(formData, { schema }) : undefined,
    shouldRevalidate: "onBlur",
  });

  const isSuccess = actionData && "success" in actionData && actionData.success;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dynamic Form Test</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {eventName
            ? `Showing dynamic fields for "${eventName}"`
            : "No event found. Create an event and add dynamic fields first."}
        </p>
      </div>

      {isSuccess && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-700">Form submitted successfully!</p>
          <pre className="mt-2 text-xs text-green-600 overflow-auto">
            {JSON.stringify((actionData as { data: unknown }).data, null, 2)}
          </pre>
        </div>
      )}

      {actionData && "errors" in actionData && (
        <div className="rounded-md bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {(actionData as { errors: string[] }).errors[0]}
          </p>
        </div>
      )}

      {fieldDefs.length === 0 ? (
        <div className="rounded-lg bg-card p-8 shadow text-center">
          <p className="text-muted-foreground">
            No dynamic fields defined yet. Use the Dynamic Fields API to create some fields, then
            refresh this page.
          </p>
        </div>
      ) : (
        <Form
          method="post"
          {...getFormProps(form)}
          className="space-y-6 rounded-lg bg-card p-8 shadow"
        >
          {form.errors && form.errors.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{form.errors[0]}</p>
            </div>
          )}

          <DynamicFieldSection fieldDefs={fieldDefs} form={form} />

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </Form>
      )}
    </div>
  );
}
