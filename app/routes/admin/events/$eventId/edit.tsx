import { data, redirect, useActionData, useLoaderData, Form } from "react-router";
import { useState } from "react";
import {
  useForm,
  getFormProps,
  getInputProps,
  getTextareaProps,
  getSelectProps,
} from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";

export const handle = { breadcrumb: "Edit Event" };

import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { updateEvent, EventError } from "~/services/events.server";
import { updateEventSchema } from "~/lib/schemas/event";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DatePicker } from "~/components/ui/date-picker";
import { ConformField } from "~/components/ui/conform-field";
import type { Route } from "./+types/edit";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "event", "update");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, tenantId, deletedAt: null },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  return { event };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "event", "update");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: updateEventSchema });

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
    await updateEvent(params.eventId, submission.value, ctx);
    return redirect("/admin/events");
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

export default function EditEventPage() {
  const { event } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [startDate, setStartDate] = useState<Date | undefined>(
    event.startDate ? new Date(event.startDate) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    event.endDate ? new Date(event.endDate) : undefined,
  );

  const [form, fields] = useForm({
    lastResult: actionData?.result,
    defaultValue: {
      name: event.name,
      description: event.description,
      status: event.status,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: updateEventSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Edit Event</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update event details for {event.name}.</p>
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
              />
            </ConformField>

            <ConformField fieldId={fields.status.id} label="Status" errors={fields.status.errors}>
              <NativeSelect {...getSelectProps(fields.status)} key={fields.status.key}>
                <NativeSelectOption value="DRAFT">Draft</NativeSelectOption>
                <NativeSelectOption value="PUBLISHED">Published</NativeSelectOption>
                <NativeSelectOption value="CANCELED">Canceled</NativeSelectOption>
                <NativeSelectOption value="COMPLETED">Completed</NativeSelectOption>
                <NativeSelectOption value="POSTPONED">Postponed</NativeSelectOption>
                <NativeSelectOption value="RESCHEDULED">Rescheduled</NativeSelectOption>
              </NativeSelect>
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
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" asChild>
                <a href="/admin/events">Cancel</a>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
