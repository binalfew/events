import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { data, Form, redirect, useActionData, useSearchParams } from "react-router";
import { z } from "zod/v4";
import { logger } from "~/lib/logger.server";
import { requireAnonymous } from "~/lib/session.server";
import {
  isCodeValid,
  getVerifySession,
  commitVerifySession,
  prepareVerification,
} from "~/lib/verification.server";
import { sendEmail } from "~/services/channels/email.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { Route } from "./+types/verify";

const verifySchema = z.object({
  code: z.string().min(6, "Code must be 6 characters").max(6, "Code must be 6 characters"),
  intent: z.enum(["verify", "resend"]),
});

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);
  const verifySession = await getVerifySession(request);
  const email = verifySession.get("onboardingEmail");
  if (!email) throw redirect("/auth/signup");
  return { email: maskEmail(email) };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAnonymous(request);
  const formData = await request.formData();
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "onboarding";

  const verifySession = await getVerifySession(request);
  const email = verifySession.get("onboardingEmail");
  if (!email || typeof email !== "string") {
    throw redirect("/auth/signup");
  }

  const intent = formData.get("intent");

  // Handle resend
  if (intent === "resend") {
    const { otp } = await prepareVerification({
      type,
      target: email,
    });

    await sendEmail(
      email,
      "Verify your email",
      `<h1>Your new verification code</h1>
      <p>Use the following code to verify your email address:</p>
      <h2 style="letter-spacing: 0.5em; font-size: 2em; text-align: center; padding: 16px; background: #f4f4f5; border-radius: 8px;">${otp}</h2>
      <p>This code expires in 10 minutes.</p>`,
    );

    logger.info({ email, otp }, "Verification code resent");

    return data({ status: "resent" as const });
  }

  // Handle verify
  const submission = parseWithZod(formData, { schema: verifySchema });

  if (submission.status !== "success") {
    return data(submission.reply(), { status: 400 });
  }

  const { code } = submission.value;

  const isValid = await isCodeValid({ code, type, target: email });

  if (!isValid) {
    return data(
      submission.reply({
        fieldErrors: {
          code: ["Invalid or expired code. Please try again."],
        },
      }),
      { status: 400 },
    );
  }

  logger.info({ email, type }, "Verification successful");

  // For onboarding, keep email in session and redirect to onboarding
  if (type === "onboarding") {
    verifySession.set("verifiedEmail", email);
    return redirect("/auth/onboarding", {
      headers: {
        "Set-Cookie": await commitVerifySession(verifySession),
      },
    });
  }

  // For other types, redirect appropriately
  return redirect("/auth/login");
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
}

export default function VerifyPage({ loaderData, actionData }: Route.ComponentProps) {
  const { email } = loaderData;
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") ?? "onboarding";
  const wasResent = actionData && "status" in actionData && actionData.status === "resent";

  const [form, fields] = useForm({
    lastResult: actionData && "status" in actionData ? undefined : actionData,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: verifySchema });
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>We sent a 6-digit code to {email}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" {...getFormProps(form)}>
                <div className="flex flex-col gap-6">
                  {form.errors && form.errors.length > 0 && (
                    <div className="rounded-md bg-destructive/10 p-3">
                      <p className="text-sm text-destructive">{form.errors[0]}</p>
                    </div>
                  )}

                  {wasResent && (
                    <div className="rounded-md bg-green-50 p-3">
                      <p className="text-sm text-green-700">
                        A new code has been sent to your email.
                      </p>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor={fields.code.id}>Verification code</Label>
                    {(() => {
                      const { key, ...codeProps } = getInputProps(fields.code, {
                        type: "text",
                      });
                      return (
                        <Input
                          key={key}
                          {...codeProps}
                          placeholder="XXXXXX"
                          autoComplete="one-time-code"
                          autoFocus
                          className="text-center text-lg tracking-widest"
                          maxLength={6}
                        />
                      );
                    })()}
                    {fields.code.errors && (
                      <p className="text-sm text-destructive">{fields.code.errors[0]}</p>
                    )}
                  </div>

                  <input type="hidden" name="intent" value="verify" />

                  <Button type="submit" className="w-full">
                    Verify
                  </Button>
                </div>
              </Form>

              <Form method="post" className="mt-4">
                <input type="hidden" name="intent" value="resend" />
                <input type="hidden" name="code" value="000000" />
                <div className="text-center text-sm">
                  Didn&apos;t receive the code?{" "}
                  <button type="submit" className="underline underline-offset-4 hover:text-primary">
                    Resend code
                  </button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
