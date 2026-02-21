import { data, redirect, useActionData, useLoaderData, Form } from "react-router";
import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { z } from "zod/v4";

export const handle = { breadcrumb: "Organization" };

import { requirePermission } from "~/lib/require-auth.server";
import { resolveTenant } from "~/lib/tenant.server";
import {
  updateTenant,
  parseTenantExtras,
  getTenantFieldDefs,
  TenantError,
} from "~/services/tenants.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ConformField } from "~/components/ui/conform-field";
import { BrandingColorSection } from "~/components/branding-color-picker";
import { LogoUpload } from "~/components/logo-upload";
import { FieldRenderer } from "~/components/fields/FieldRenderer";
import type { Route } from "./+types/organization";

const organizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  logoUrl: z.string().optional(),
  brandTheme: z.string().optional(),
});

export async function loader({ request, params }: Route.LoaderArgs) {
  await requirePermission(request, "settings", "manage");
  const tenant = await resolveTenant(params.tenant);
  const fieldDefs = await getTenantFieldDefs(tenant.id);

  return { tenant, fieldDefs };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenant = await resolveTenant(params.tenant);

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: organizationSchema });

  if (submission.status !== "success") {
    return data({ result: submission.reply() }, { status: 400 });
  }

  const extras = await parseTenantExtras(formData, tenant.id);

  const ctx = {
    userId: user.id,
    tenantId: tenant.id,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    await updateTenant(
      tenant.id,
      {
        ...submission.value,
        slug: tenant.slug,
        subscriptionPlan: tenant.subscriptionPlan,
        extras,
      },
      ctx,
    );
    return redirect(`/${params.tenant}/settings/organization`);
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

export default function OrganizationSettingsPage() {
  const { tenant, fieldDefs } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const extrasObj = (tenant.extras ?? {}) as Record<string, unknown>;
  const dynamicDefaults: Record<string, unknown> = {};
  for (const fd of fieldDefs) {
    dynamicDefaults[fd.name] = extrasObj[fd.name] ?? "";
  }

  const [form, fields] = useForm({
    lastResult: actionData?.result,
    defaultValue: {
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      website: tenant.website ?? "",
      address: tenant.address ?? "",
      city: tenant.city ?? "",
      state: tenant.state ?? "",
      zip: tenant.zip ?? "",
      country: tenant.country ?? "",
      ...dynamicDefaults,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: organizationSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Organization</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization's details and branding.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Update your organization's contact information and branding.
          </CardDescription>
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
              label="Organization Name"
              required
              errors={fields.name.errors}
            >
              <Input {...getInputProps(fields.name, { type: "text" })} key={fields.name.key} />
            </ConformField>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ConformField
                fieldId={fields.email.id}
                label="Email"
                required
                errors={fields.email.errors}
              >
                <Input {...getInputProps(fields.email, { type: "email" })} key={fields.email.key} />
              </ConformField>

              <ConformField
                fieldId={fields.phone.id}
                label="Phone"
                required
                errors={fields.phone.errors}
              >
                <Input {...getInputProps(fields.phone, { type: "tel" })} key={fields.phone.key} />
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

            {fieldDefs.map((fd) => {
              const meta = (form as any).getFieldset()[fd.name];
              if (!meta) return null;
              return <FieldRenderer key={fd.id} fieldDef={fd} meta={meta} />;
            })}

            <LogoUpload initialLogoUrl={tenant.logoUrl} />

            <BrandingColorSection initialBrandTheme={tenant.brandTheme ?? ""} />

            <div className="flex gap-3 pt-4">
              <Button type="submit">Save Changes</Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
