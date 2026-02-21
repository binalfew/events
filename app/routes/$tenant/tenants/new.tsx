import { data, redirect, useActionData, Form } from "react-router";
import { useForm, getFormProps, getInputProps, getSelectProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";

export const handle = { breadcrumb: "New Tenant" };

import { requirePermission } from "~/lib/require-auth.server";
import { createTenant, TenantError } from "~/services/tenants.server";
import { createTenantSchema } from "~/lib/schemas/tenant";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { BrandingColorSection } from "~/components/branding-color-picker";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ConformField } from "~/components/ui/conform-field";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/new";

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: createTenantSchema });

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
    await createTenant(submission.value, ctx);
    return redirect(`/${params.tenant}/tenants`);
  } catch (error) {
    if (error instanceof TenantError) {
      return data(
        { result: submission.reply({ formErrors: [error.message] }) },
        { status: error.status },
      );
    }
    throw error;
  }
}

export default function NewTenantPage() {
  const actionData = useActionData<typeof action>();
  const basePrefix = useBasePrefix();

  const [form, fields] = useForm({
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: createTenantSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Create Tenant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new organization to the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Details</CardTitle>
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
                placeholder="e.g. Acme Corporation"
              />
            </ConformField>

            <ConformField
              fieldId={fields.slug.id}
              label="URL Slug"
              required
              errors={fields.slug.errors}
            >
              <Input
                {...getInputProps(fields.slug, { type: "text" })}
                key={fields.slug.key}
                placeholder="e.g. acme-corp"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used in URLs: /<em>slug</em>/events. Lowercase letters, numbers, and hyphens only.
              </p>
            </ConformField>

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
                  placeholder="admin@example.com"
                />
              </ConformField>

              <ConformField
                fieldId={fields.phone.id}
                label="Phone"
                required
                errors={fields.phone.errors}
              >
                <Input
                  {...getInputProps(fields.phone, { type: "tel" })}
                  key={fields.phone.key}
                  placeholder="+1-000-000-0000"
                />
              </ConformField>
            </div>

            <ConformField
              fieldId={fields.website.id}
              label="Website"
              errors={fields.website.errors}
            >
              <Input
                {...getInputProps(fields.website, { type: "url" })}
                key={fields.website.key}
                placeholder="https://example.com"
              />
            </ConformField>

            <ConformField
              fieldId={fields.address.id}
              label="Address"
              errors={fields.address.errors}
            >
              <Input
                {...getInputProps(fields.address, { type: "text" })}
                key={fields.address.key}
                placeholder="123 Main St"
              />
            </ConformField>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ConformField fieldId={fields.city.id} label="City" errors={fields.city.errors}>
                <Input {...getInputProps(fields.city, { type: "text" })} key={fields.city.key} />
              </ConformField>

              <ConformField fieldId={fields.state.id} label="State" errors={fields.state.errors}>
                <Input {...getInputProps(fields.state, { type: "text" })} key={fields.state.key} />
              </ConformField>

              <ConformField fieldId={fields.zip.id} label="ZIP" errors={fields.zip.errors}>
                <Input {...getInputProps(fields.zip, { type: "text" })} key={fields.zip.key} />
              </ConformField>

              <ConformField
                fieldId={fields.country.id}
                label="Country"
                errors={fields.country.errors}
              >
                <Input
                  {...getInputProps(fields.country, { type: "text" })}
                  key={fields.country.key}
                />
              </ConformField>
            </div>

            <ConformField
              fieldId={fields.subscriptionPlan.id}
              label="Subscription Plan"
              errors={fields.subscriptionPlan.errors}
            >
              <NativeSelect
                {...getSelectProps(fields.subscriptionPlan)}
                key={fields.subscriptionPlan.key}
              >
                <NativeSelectOption value="free">Free</NativeSelectOption>
                <NativeSelectOption value="starter">Starter</NativeSelectOption>
                <NativeSelectOption value="professional">Professional</NativeSelectOption>
                <NativeSelectOption value="enterprise">Enterprise</NativeSelectOption>
              </NativeSelect>
            </ConformField>

            <BrandingColorSection />

            <div className="flex gap-3 pt-4">
              <Button type="submit">Create Tenant</Button>
              <Button type="button" variant="outline" asChild>
                <a href={`${basePrefix}/tenants`}>Cancel</a>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
