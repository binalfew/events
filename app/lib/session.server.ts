import { createCookieSessionStorage, redirect } from "react-router";
import { env } from "~/lib/env.server";
import { prisma } from "~/lib/db.server";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [env.SESSION_SECRET],
    secure: env.NODE_ENV === "production",
    maxAge: env.SESSION_MAX_AGE / 1000,
  },
});

export function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(request: Request, redirectTo?: string): Promise<string> {
  const userId = await getUserId(request);
  if (!userId) {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams([
      ["redirectTo", redirectTo ?? `${url.pathname}${url.search}`],
    ]);
    throw redirect(`/auth/login?${searchParams}`);
  }
  return userId;
}

const userCache = new WeakMap<Request, ReturnType<typeof fetchUser>>();

async function fetchUser(request: Request) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findFirst({
    where: { id: userId },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });
  if (!user) {
    throw await logout(request);
  }
  return user;
}

export function requireUser(request: Request) {
  const existing = userCache.get(request);
  if (existing) return existing;
  const promise = fetchUser(request);
  userCache.set(request, promise);
  return promise;
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/auth/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
