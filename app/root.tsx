import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { initSentryClient, captureException as captureClientException } from "~/lib/sentry.client";
import { useNonce } from "~/lib/nonce-provider";
import { getTheme } from "~/lib/theme.server";
import { getColorTheme } from "~/lib/color-theme.server";
import { useOptimisticThemeMode } from "~/routes/resources/theme-switch";
import { useOptimisticColorTheme } from "~/routes/resources/color-theme";
import type { Theme } from "~/lib/theme.server";
import type { ColorTheme } from "~/lib/color-theme";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function loader({ request }: Route.LoaderArgs) {
  return {
    sentryDsn: process.env.SENTRY_DSN || "",
    theme: getTheme(request),
    colorTheme: getColorTheme(request),
  };
}

function useThemeClass(): string {
  const data = useRouteLoaderData("root") as { theme: Theme | null } | undefined;
  const optimisticMode = useOptimisticThemeMode();
  if (optimisticMode) {
    return optimisticMode === "system" ? "" : optimisticMode;
  }
  return data?.theme ?? "";
}

function useColorThemeData(): ColorTheme {
  const data = useRouteLoaderData("root") as { colorTheme: ColorTheme } | undefined;
  const optimistic = useOptimisticColorTheme();
  return optimistic ?? data?.colorTheme ?? "default";
}

export function Layout({ children }: { children: React.ReactNode }) {
  const nonce = useNonce();
  const themeClass = useThemeClass();
  const colorTheme = useColorThemeData();

  return (
    <html
      lang="en"
      className={themeClass}
      data-theme={colorTheme !== "default" ? colorTheme : undefined}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData("root") as { sentryDsn?: string } | undefined;

  useEffect(() => {
    if (data?.sentryDsn) {
      initSentryClient(data.sentryDsn);
    }
  }, [data?.sentryDsn]);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  // Report non-Response errors to Sentry on the client
  useEffect(() => {
    if (error && !(error instanceof Response) && !isRouteErrorResponse(error)) {
      captureClientException(error);
    }
  }, [error]);

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
