import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { data, Form, Link, redirect, useActionData, useLoaderData } from "react-router";
import { z } from "zod/v4";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { twoFAVerificationType } from "~/lib/2fa-constants";
import { prisma } from "~/lib/db.server";
import { requireUserId } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ConformField } from "~/components/ui/conform-field";
import type { Route } from "./+types/index";

export const handle = { breadcrumb: "Profile" };

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens, and underscores"),
});

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, username: true },
  });

  const twoFA = await prisma.verification.findUnique({
    select: { id: true },
    where: {
      target_type: { target: userId, type: twoFAVerificationType },
    },
  });

  return { user, isTwoFAEnabled: Boolean(twoFA) };
}

export async function action({ request, params }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: profileSchema });

  if (submission.status !== "success") {
    return data(submission.reply(), { status: 400 });
  }

  const { name, username } = submission.value;

  // Check username uniqueness
  const existing = await prisma.user.findFirst({
    where: { username, id: { not: userId } },
    select: { id: true },
  });
  if (existing) {
    return data(submission.reply({ fieldErrors: { username: ["Username is already taken"] } }), {
      status: 400,
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name, username },
  });

  return redirect(`/${params.tenant}/profile`);
}

export default function ProfilePage({ actionData }: Route.ComponentProps) {
  const { user, isTwoFAEnabled } = useLoaderData<typeof loader>();

  const [form, fields] = useForm({
    lastResult: actionData,
    defaultValue: {
      name: user.name ?? "",
      username: user.username,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: profileSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings and security.
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and username.</CardDescription>
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

            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed from here.</p>
            </div>

            <ConformField
              fieldId={fields.name.id}
              label="Name"
              required
              errors={fields.name.errors}
            >
              <Input
                {...getInputProps(fields.name, { type: "text" })}
                key={fields.name.key}
                placeholder="Your full name"
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
                placeholder="your-username"
              />
            </ConformField>

            <div className="pt-2">
              <Button type="submit">Save Changes</Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Security / 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage two-factor authentication for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isTwoFAEnabled ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                  <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {isTwoFAEnabled
                    ? "Your account is protected with 2FA"
                    : "Add an extra layer of security"}
                </p>
              </div>
            </div>
            <Button asChild variant={isTwoFAEnabled ? "outline" : "default"} size="sm">
              <Link to="two-factor">{isTwoFAEnabled ? "Manage" : "Enable"}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
