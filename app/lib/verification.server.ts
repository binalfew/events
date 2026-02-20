import { generateTOTP, verifyTOTP } from "@epic-web/totp";
import { createCookieSessionStorage, redirect } from "react-router";
import { prisma } from "~/lib/db.server";
import { env } from "~/lib/env.server";

// ─── Verify Session Storage ─────────────────────────────

const verifySessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__verification",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [env.SESSION_SECRET],
    secure: env.NODE_ENV === "production",
    maxAge: 10 * 60, // 10 minutes
  },
});

export function getVerifySession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return verifySessionStorage.getSession(cookie);
}

export function commitVerifySession(session: Awaited<ReturnType<typeof getVerifySession>>) {
  return verifySessionStorage.commitSession(session);
}

export function destroyVerifySession(session: Awaited<ReturnType<typeof getVerifySession>>) {
  return verifySessionStorage.destroySession(session);
}

// ─── OTP Generation & Validation ─────────────────────────

export async function prepareVerification({
  type,
  target,
  period = 10 * 60, // 10 minutes default
}: {
  type: string;
  target: string;
  period?: number;
}) {
  const {
    otp,
    secret,
    algorithm,
    period: totpPeriod,
    digits,
    charSet,
  } = await generateTOTP({ period, algorithm: "SHA-256" });

  const expiresAt = new Date(Date.now() + period * 1000);

  await prisma.verification.upsert({
    where: { target_type: { target, type } },
    update: {
      secret,
      algorithm,
      digits,
      period: totpPeriod,
      charSet,
      expiresAt,
    },
    create: {
      type,
      target,
      secret,
      algorithm,
      digits,
      period: totpPeriod,
      charSet,
      expiresAt,
    },
  });

  return { otp };
}

export async function isCodeValid({
  code,
  type,
  target,
}: {
  code: string;
  type: string;
  target: string;
}) {
  const verification = await prisma.verification.findUnique({
    where: { target_type: { target, type } },
  });
  if (!verification) return false;
  if (verification.expiresAt && verification.expiresAt < new Date()) return false;

  const result = await verifyTOTP({
    otp: code,
    secret: verification.secret,
    algorithm: verification.algorithm,
    digits: verification.digits,
    period: verification.period,
    charSet: verification.charSet,
  });

  if (!result) return false;

  // Delete after successful verification
  await prisma.verification.delete({ where: { id: verification.id } });
  return true;
}

// ─── Session Helpers ─────────────────────────────────────

export async function requireOnboardingEmail(request: Request): Promise<string> {
  const verifySession = await getVerifySession(request);
  const email = verifySession.get("onboardingEmail");
  if (!email || typeof email !== "string") {
    throw redirect("/auth/signup");
  }
  return email;
}
