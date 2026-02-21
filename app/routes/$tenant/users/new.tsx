import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useRouteLoaderData,
  Form,
} from "react-router";
import { useForm, getFormProps, getInputProps, getSelectProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";

export const handle = { breadcrumb: "New User" };

import { requirePermission } from "~/lib/require-auth.server";
import { createUser, UserError } from "~/services/users.server";
import { listTenants } from "~/services/tenants.server";
import { createUserSchema } from "~/lib/schemas/user";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ConformField } from "~/components/ui/conform-field";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/new";

export async function loader({ request }: Route.LoaderArgs) {
  const { isSuperAdmin } = await requirePermission(request, "settings", "manage");

  let tenants: Array<{ id: string; name: string; slug: string }> = [];
  if (isSuperAdmin) {
    tenants = (await listTenants()).map((t) => ({ id: t.id, name: t.name, slug: t.slug }));
  }

  return { tenants, isSuperAdmin };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user, isSuperAdmin } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: createUserSchema });

  if (submission.status !== "success") {
    return data({ result: submission.reply() }, { status: 400 });
  }

  // Only super admins can assign users to other tenants
  const targetTenantId =
    isSuperAdmin && submission.value.tenantId ? submission.value.tenantId : tenantId;

  const ctx = {
    userId: user.id,
    tenantId: targetTenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    await createUser({ ...submission.value, tenantId: undefined }, ctx);
    return redirect(`/${params.tenant}/users`);
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
  const { tenants, isSuperAdmin } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const basePrefix = useBasePrefix();

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
          Add a new user account{isSuperAdmin ? " to any organization" : " to your organization"}.
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

            {isSuperAdmin && tenants.length > 0 && (
              <ConformField
                fieldId={fields.tenantId.id}
                label="Tenant"
                required
                errors={fields.tenantId.errors}
                description="Which organization should this user belong to?"
              >
                <NativeSelect {...getSelectProps(fields.tenantId)} key={fields.tenantId.key}>
                  <NativeSelectOption value="">Select a tenant...</NativeSelectOption>
                  {tenants.map((t) => (
                    <NativeSelectOption key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </ConformField>
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
                <a href={`${basePrefix}/users`}>Cancel</a>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
