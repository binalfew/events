import { data, redirect, useActionData, Form } from "react-router";
import { useForm, getFormProps, getInputProps, getSelectProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";

export const handle = { breadcrumb: "New User" };

import { requirePermission } from "~/lib/require-auth.server";
import { createUser, UserError } from "~/services/users.server";
import { createUserSchema } from "~/lib/schemas/user";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ConformField } from "~/components/ui/conform-field";
import type { Route } from "./+types/new";

export async function action({ request }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: createUserSchema });

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
    await createUser(submission.value, ctx);
    return redirect("/admin/users");
  } catch (error) {
    if (error instanceof UserError) {
      return data(
        { result: submission.reply({ formErrors: [error.message] }) },
        { status: error.status },
      );
    }
    throw error;
  }
}

export default function NewUserPage() {
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: createUserSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Create User</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new user account to your organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ConformField
                fieldId={fields.email.id}
                label="Email"
                required
                errors={fields.email.errors}
              >
                <Input
                  {...getInputProps(fields.email, { type: "email" })}
                  key={fields.email.key}
                  placeholder="user@example.com"
                />
              </ConformField>

              <ConformField
                fieldId={fields.username.id}
                label="Username"
                required
                errors={fields.username.errors}
              >
                <Input
                  {...getInputProps(fields.username, { type: "text" })}
                  key={fields.username.key}
                  placeholder="e.g. jdoe"
                />
              </ConformField>
            </div>

            <ConformField fieldId={fields.name.id} label="Full Name" errors={fields.name.errors}>
              <Input
                {...getInputProps(fields.name, { type: "text" })}
                key={fields.name.key}
                placeholder="e.g. John Doe"
              />
            </ConformField>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ConformField
                fieldId={fields.password.id}
                label="Password"
                required
                errors={fields.password.errors}
              >
                <Input
                  {...getInputProps(fields.password, { type: "password" })}
                  key={fields.password.key}
                  placeholder="Minimum 8 characters"
                />
              </ConformField>

              <ConformField fieldId={fields.status.id} label="Status" errors={fields.status.errors}>
                <NativeSelect {...getSelectProps(fields.status)} key={fields.status.key}>
                  <NativeSelectOption value="ACTIVE">Active</NativeSelectOption>
                  <NativeSelectOption value="INACTIVE">Inactive</NativeSelectOption>
                  <NativeSelectOption value="SUSPENDED">Suspended</NativeSelectOption>
                </NativeSelect>
              </ConformField>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit">Create User</Button>
              <Button type="button" variant="outline" asChild>
                <a href="/admin/users">Cancel</a>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
