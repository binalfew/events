import { data, redirect, useActionData, useLoaderData, Form } from "react-router";
import { useForm, getFormProps, getInputProps, getSelectProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";

export const handle = { breadcrumb: "Edit User" };

import { requirePermission } from "~/lib/require-auth.server";
import { getUser, updateUser, changePassword, UserError } from "~/services/users.server";
import { updateUserSchema, changePasswordSchema } from "~/lib/schemas/user";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ConformField } from "~/components/ui/conform-field";
import type { Route } from "./+types/edit";

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const targetUser = await getUser(params.userId, tenantId);
  return { targetUser };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  if (intent === "changePassword") {
    const submission = parseWithZod(formData, { schema: changePasswordSchema });
    if (submission.status !== "success") {
      return data({ passwordResult: submission.reply() }, { status: 400 });
    }
    try {
      await changePassword(params.userId, submission.value.newPassword, ctx);
      return data({ passwordResult: submission.reply({ resetForm: true }), passwordSuccess: true });
    } catch (error) {
      if (error instanceof UserError) {
        return data(
          { passwordResult: submission.reply({ formErrors: [error.message] }) },
          { status: error.status },
        );
      }
      throw error;
    }
  }

  const submission = parseWithZod(formData, { schema: updateUserSchema });
  if (submission.status !== "success") {
    return data({ result: submission.reply() }, { status: 400 });
  }

  try {
    await updateUser(params.userId, submission.value, ctx);
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

export default function EditUserPage() {
  const { targetUser } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    lastResult: actionData && "result" in actionData ? actionData.result : undefined,
    defaultValue: {
      email: targetUser.email,
      username: targetUser.username,
      name: targetUser.name ?? "",
      status: targetUser.status,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: updateUserSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  const [pwForm, pwFields] = useForm({
    lastResult:
      actionData && "passwordResult" in actionData ? actionData.passwordResult : undefined,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: changePasswordSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Edit User</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update details for {targetUser.name || targetUser.email}.
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
                />
              </ConformField>
            </div>

            <ConformField fieldId={fields.name.id} label="Full Name" errors={fields.name.errors}>
              <Input {...getInputProps(fields.name, { type: "text" })} key={fields.name.key} />
            </ConformField>

            <ConformField fieldId={fields.status.id} label="Status" errors={fields.status.errors}>
              <NativeSelect {...getSelectProps(fields.status)} key={fields.status.key}>
                <NativeSelectOption value="ACTIVE">Active</NativeSelectOption>
                <NativeSelectOption value="INACTIVE">Inactive</NativeSelectOption>
                <NativeSelectOption value="SUSPENDED">Suspended</NativeSelectOption>
                <NativeSelectOption value="LOCKED">Locked</NativeSelectOption>
              </NativeSelect>
            </ConformField>

            <div className="flex gap-3 pt-4">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" asChild>
                <a href="/admin/users">Cancel</a>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" {...getFormProps(pwForm)} className="space-y-4">
            <input type="hidden" name="intent" value="changePassword" />

            {actionData &&
              "passwordSuccess" in actionData &&
              (actionData as any).passwordSuccess && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                  Password changed successfully.
                </div>
              )}

            {pwForm.errors && pwForm.errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {pwForm.errors.map((error, i) => (
                  <p key={i}>{error}</p>
                ))}
              </div>
            )}

            <ConformField
              fieldId={pwFields.newPassword.id}
              label="New Password"
              required
              errors={pwFields.newPassword.errors}
            >
              <Input
                {...getInputProps(pwFields.newPassword, { type: "password" })}
                key={pwFields.newPassword.key}
                placeholder="Minimum 8 characters"
              />
            </ConformField>

            <div className="pt-2">
              <Button type="submit" variant="outline">
                Change Password
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
