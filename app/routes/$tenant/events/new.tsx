import { data, redirect, useActionData, Form } from "react-router";
import { useState } from "react";
import { useForm, getFormProps, getInputProps, getTextareaProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";

export const handle = { breadcrumb: "New Event" };

import { requirePermission } from "~/lib/require-auth.server";
import { createEvent, EventError } from "~/services/events.server";
import { createEventSchema } from "~/lib/schemas/event";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DatePicker } from "~/components/ui/date-picker";
import { ConformField } from "~/components/ui/conform-field";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/new";

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "event", "create");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: createEventSchema });

  if (submission.status !== "success") {
    return data({ result: submission.reply() }, { status: 400 });
  }

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    await createEvent(submission.value, ctx);
    return redirect(`/${params.tenant}/events`);
  } catch (error) {
    if (error instanceof EventError) {
      return data(
        { result: submission.reply({ formErrors: [error.message] }) },
        { status: error.status },
      );
    }
    throw error;
  }
}

export default function NewEventPage() {
  const actionData = useActionData<typeof action>();
  const basePrefix = useBasePrefix();

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [form, fields] = useForm({
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: createEventSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Create Event</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new event. You can add fields and forms after creation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" {...getFormProps(form)} className="space-y-4">
            {form.errors && form.errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {form.errors.map((error, i) => (
                  <p key={i}>{error}</p>
                ))}
              </div>
            )}

            <ConformField
              fieldId={fields.name.id}
              label="Name"
              required
              errors={fields.name.errors}
            >
              <Input
                {...getInputProps(fields.name, { type: "text" })}
                key={fields.name.key}
                placeholder="e.g. Annual Conference 2026"
              />
            </ConformField>

            <ConformField
              fieldId={fields.description.id}
              label="Description"
              errors={fields.description.errors}
            >
              <Textarea
                {...getTextareaProps(fields.description)}
                key={fields.description.key}
                rows={3}
                placeholder="Brief description of the event..."
              />
            </ConformField>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ConformField
                fieldId={fields.startDate.id}
                label="Start Date"
                required
                errors={fields.startDate.errors}
              >
                <DatePicker
                  name={fields.startDate.name}
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Select start date"
                  required
                />
              </ConformField>

              <ConformField
                fieldId={fields.endDate.id}
                label="End Date"
                required
                errors={fields.endDate.errors}
              >
                <DatePicker
                  name={fields.endDate.name}
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Select end date"
                  required
                />
              </ConformField>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit">Create Event</Button>
              <Button type="button" variant="outline" asChild>
                <a href={`${basePrefix}/events`}>Cancel</a>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
