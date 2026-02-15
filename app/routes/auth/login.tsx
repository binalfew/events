import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { data, Form, redirect, useActionData } from "react-router";
import { z } from "zod/v4";
import { verifyPassword } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { env } from "~/lib/env.server";
import { logger } from "~/lib/logger.server";
import { getUserId, createUserSession } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { Route } from "./+types/login";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  redirectTo: z.string().optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) throw redirect("/dashboard");
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: loginSchema });

  if (submission.status !== "success") {
    return data(submission.reply(), { status: 400 });
  }

  const { email, password, redirectTo } = submission.value;

  const user = await prisma.user.findFirst({
    where: { email },
    include: { password: true },
  });

  if (!user || !user.password) {
    logger.info({ email }, "Login failed: user not found");
    await prisma.auditLog.create({
      data: {
        action: "LOGIN",
        entityType: "User",
        description: "Login failed — invalid credentials",
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
        metadata: { email, reason: "not_found" },
      },
    });
    return data(submission.reply({ formErrors: ["Invalid email or password"] }), { status: 400 });
  }

  // Check lockout
  if (user.status === "LOCKED") {
    if (user.autoUnlockAt && user.autoUnlockAt <= new Date()) {
      // Auto-unlock
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: "ACTIVE",
          failedLoginAttempts: 0,
          lockedAt: null,
          lockReason: null,
          autoUnlockAt: null,
        },
      });
    } else {
      logger.info({ userId: user.id }, "Login failed: account locked");
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId,
          action: "LOGIN",
          entityType: "User",
          entityId: user.id,
          description: "Login failed — account locked",
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
          metadata: { reason: "locked" },
        },
      });
      return data(
        submission.reply({
          formErrors: ["Account is locked. Please try again later or contact an administrator."],
        }),
        { status: 403 },
      );
    }
  }

  // Check inactive/suspended
  if (user.status === "INACTIVE" || user.status === "SUSPENDED") {
    logger.info({ userId: user.id, status: user.status }, "Login failed: account not active");
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        action: "LOGIN",
        entityType: "User",
        entityId: user.id,
        description: `Login failed — account ${user.status.toLowerCase()}`,
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
        metadata: { reason: user.status.toLowerCase() },
      },
    });
    return data(
      submission.reply({
        formErrors: ["Your account is not active. Please contact an administrator."],
      }),
      { status: 403 },
    );
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password.hash);
  if (!isValid) {
    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= env.MAX_LOGIN_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lastFailedLoginAt: new Date(),
        ...(shouldLock && {
          status: "LOCKED",
          lockedAt: new Date(),
          lockReason: "Too many failed login attempts",
          lockCount: { increment: 1 },
          autoUnlockAt: new Date(Date.now() + env.LOCKOUT_DURATION_MINUTES * 60 * 1000),
        }),
      },
    });

    logger.info({ userId: user.id, attempts: newAttempts }, "Login failed: wrong password");
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        action: "LOGIN",
        entityType: "User",
        entityId: user.id,
        description: shouldLock
          ? "Login failed — account locked after too many attempts"
          : `Login failed — wrong password (attempt ${newAttempts})`,
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
        metadata: { reason: "wrong_password", attempts: newAttempts, locked: shouldLock },
      },
    });

    return data(submission.reply({ formErrors: ["Invalid email or password"] }), { status: 400 });
  }

  // Success — reset failed attempts and log in
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lastFailedLoginAt: null },
  });

  logger.info({ userId: user.id }, "Login successful");
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      tenantId: user.tenantId,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      description: "Login successful",
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
  });

  return createUserSession(user.id, redirectTo || "/dashboard");
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Accreditation Platform
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
        </div>

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

          <div>
            <Label htmlFor={fields.email.id}>Email address</Label>
            {(() => {
              const { key, ...emailProps } = getInputProps(fields.email, { type: "email" });
              return <Input key={key} {...emailProps} autoComplete="email" className="mt-1" />;
            })()}
            {fields.email.errors && (
              <p className="mt-1 text-sm text-destructive">{fields.email.errors[0]}</p>
            )}
          </div>

          <div>
            <Label htmlFor={fields.password.id}>Password</Label>
            {(() => {
              const { key, ...passwordProps } = getInputProps(fields.password, {
                type: "password",
              });
              return (
                <Input
                  key={key}
                  {...passwordProps}
                  autoComplete="current-password"
                  className="mt-1"
                />
              );
            })()}
            {fields.password.errors && (
              <p className="mt-1 text-sm text-destructive">{fields.password.errors[0]}</p>
            )}
          </div>

          <input type="hidden" name="redirectTo" value="" />

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </Form>
      </div>
    </div>
  );
}
