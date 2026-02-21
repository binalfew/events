import { data, redirect, useActionData, useLoaderData, Form } from "react-router";
import { useState } from "react";
import { useForm, getFormProps, getInputProps, getSelectProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";

export const handle = { breadcrumb: "Edit Tenant" };

import { requirePermission } from "~/lib/require-auth.server";
import { getTenant, updateTenant, TenantError } from "~/services/tenants.server";
import { updateTenantSchema } from "~/lib/schemas/tenant";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ConformField } from "~/components/ui/conform-field";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/edit";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requirePermission(request, "settings", "manage");

  const tenant = await getTenant(params.tenantId);
  return { tenant };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "settings", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: updateTenantSchema });

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
    await updateTenant(params.tenantId, submission.value, ctx);
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

export default function EditTenantPage() {
  const { tenant } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const basePrefix = useBasePrefix();

  const [form, fields] = useForm({
    lastResult: actionData?.result,
    defaultValue: {
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email,
      phone: tenant.phone,
      website: tenant.website ?? "",
      address: tenant.address ?? "",
      city: tenant.city ?? "",
      state: tenant.state ?? "",
      zip: tenant.zip ?? "",
      country: tenant.country ?? "",
      subscriptionPlan: tenant.subscriptionPlan,
      primaryColor: tenant.primaryColor ?? "",
      secondaryColor: tenant.secondaryColor ?? "",
      accentColor: tenant.accentColor ?? "",
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: updateTenantSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Edit Tenant</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update details for {tenant.name}.</p>
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

            <BrandingColorSection fields={fields} />

            <div className="flex gap-3 pt-4">
              <Button type="submit">Save Changes</Button>
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

// ─── Color Picker Components ──────────────────────────────

function ColorPickerField({
  field,
  label,
  description,
  defaultColor,
  initialValue,
}: {
  field: { id: string; name: string; key: string | undefined; errors?: string[] };
  label: string;
  description: string;
  defaultColor: string;
  initialValue?: string;
}) {
  const [color, setColor] = useState(initialValue || defaultColor);

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color || defaultColor}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
          aria-label={`${label} picker`}
        />
        <Input
          id={field.id}
          name={field.name}
          key={field.key}
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder={defaultColor}
          className="flex-1 font-mono"
        />
        {color && (
          <div
            className="flex h-10 items-center gap-2 rounded-md border px-3 text-xs"
            style={{ backgroundColor: color, color: isLightColor(color) ? "#000" : "#fff" }}
          >
            Preview
          </div>
        )}
      </div>
      {field.errors && field.errors.length > 0 && (
        <p className="text-sm text-destructive">{field.errors[0]}</p>
      )}
    </div>
  );
}

function BrandingColorSection({ fields }: { fields: Record<string, any> }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Branding Colors</h3>
        <p className="text-xs text-muted-foreground">
          These colors personalize the tenant's dashboard. Pick a color using the swatch or type a
          hex code.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <ColorPickerField
          field={fields.primaryColor}
          label="Primary Color"
          description="Sidebar background, buttons, and active elements."
          defaultColor="#1e40af"
          initialValue={fields.primaryColor.initialValue}
        />
        <ColorPickerField
          field={fields.secondaryColor}
          label="Secondary Color"
          description="Headers, navigation highlights, and secondary accents."
          defaultColor="#1e3a5f"
          initialValue={fields.secondaryColor.initialValue}
        />
        <ColorPickerField
          field={fields.accentColor}
          label="Accent Color"
          description="Badges, notifications, and call-to-action highlights."
          defaultColor="#f59e0b"
          initialValue={fields.accentColor.initialValue}
        />
      </div>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
