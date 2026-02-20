import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { data, Form, Link, redirect, useActionData } from "react-router";
import { z } from "zod/v4";
import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { requireAnonymous } from "~/lib/session.server";
import { SignupEmailSchema } from "~/lib/schemas/user";
import {
  prepareVerification,
  getVerifySession,
  commitVerifySession,
} from "~/lib/verification.server";
import { sendEmail } from "~/services/channels/email.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { Route } from "./+types/signup";

const signupSchema = z.object({
  email: SignupEmailSchema,
});

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  await requireAnonymous(request);
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: signupSchema });

  if (submission.status !== "success") {
    return data(submission.reply(), { status: 400 });
  }

  const { email } = submission.value;

  // Check if email already exists
  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (existingUser) {
    return data(
      submission.reply({
        fieldErrors: {
          email: ["An account with this email already exists"],
        },
      }),
      { status: 400 },
    );
  }

  // Generate OTP and store verification
  const { otp } = await prepareVerification({
    type: "onboarding",
    target: email,
  });

  // Send OTP email
  await sendEmail(
    email,
    "Verify your email",
    `<h1>Your verification code</h1>
    <p>Use the following code to verify your email address:</p>
    <h2 style="letter-spacing: 0.5em; font-size: 2em; text-align: center; padding: 16px; background: #f4f4f5; border-radius: 8px;">${otp}</h2>
    <p>This code expires in 10 minutes.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>`,
  );

  logger.info({ email, otp }, "Signup OTP sent");

  // Store email in verify session and redirect
  const verifySession = await getVerifySession(request);
  verifySession.set("onboardingEmail", email);

  return redirect("/auth/verify?type=onboarding", {
    headers: {
      "Set-Cookie": await commitVerifySession(verifySession),
    },
  });
}

export default function SignupPage({ actionData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    lastResult: actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: signupSchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create an account</CardTitle>
              <CardDescription>Enter your email to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" {...getFormProps(form)}>
                <div className="flex flex-col gap-6">
                  {form.errors && form.errors.length > 0 && (
                    <div className="rounded-md bg-destructive/10 p-3">
                      <p className="text-sm text-destructive">{form.errors[0]}</p>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor={fields.email.id}>Email</Label>
                    {(() => {
                      const { key, ...emailProps } = getInputProps(fields.email, { type: "email" });
                      return (
                        <Input
                          key={key}
                          {...emailProps}
                          placeholder="m@example.com"
                          autoComplete="email"
                          autoFocus
                        />
                      );
                    })()}
                    {fields.email.errors && (
                      <p className="text-sm text-destructive">{fields.email.errors[0]}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full">
                    Continue
                  </Button>

                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link to="/auth/login" className="underline underline-offset-4">
                      Log in
                    </Link>
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
