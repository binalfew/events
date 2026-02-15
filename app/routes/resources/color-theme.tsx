import { data, useFetcher, useFetchers, useRouteLoaderData } from "react-router";
import { z } from "zod";
import { Check, Palette } from "lucide-react";
import { COLOR_THEMES, type ColorTheme } from "~/lib/color-theme";
import { setColorTheme } from "~/lib/color-theme.server";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Route } from "./+types/color-theme";

const ColorThemeSchema = z.object({
  colorTheme: z.enum(COLOR_THEMES),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = ColorThemeSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ success: false }, { status: 400 });
  }

  return data(
    { success: true },
    { headers: { "Set-Cookie": setColorTheme(result.data.colorTheme) } },
  );
}

export function useOptimisticColorTheme(): ColorTheme | undefined {
  const fetchers = useFetchers();
  const colorFetcher = fetchers.find((f) => f.formAction === "/resources/color-theme");

  if (colorFetcher?.formData) {
    const result = ColorThemeSchema.safeParse(Object.fromEntries(colorFetcher.formData));
    if (result.success) {
      return result.data.colorTheme;
    }
  }
}

export function useColorTheme(): ColorTheme {
  const rootData = useRouteLoaderData("root") as { colorTheme: ColorTheme } | undefined;
  const optimistic = useOptimisticColorTheme();
  return optimistic ?? rootData?.colorTheme ?? "default";
}

const THEME_COLORS: Record<Exclude<ColorTheme, "default">, string> = {
  blue: "bg-blue-500",
  green: "bg-[#3F734B]",
  rose: "bg-rose-500",
  orange: "bg-orange-500",
  violet: "bg-violet-500",
  yellow: "bg-yellow-500",
};

export function ColorThemeSelector({ currentTheme }: { currentTheme?: ColorTheme }) {
  const fetcher = useFetcher<typeof action>();
  const optimistic = useOptimisticColorTheme();
  const active = optimistic ?? currentTheme ?? "default";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Palette className="size-4" />
          <span className="sr-only">Change accent color</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto p-3">
        <div className="grid grid-cols-4 gap-2">
          {/* Default (neutral) swatch */}
          <fetcher.Form method="POST" action="/resources/color-theme">
            <input type="hidden" name="colorTheme" value="default" />
            <button
              type="submit"
              className={`relative flex size-8 items-center justify-center rounded-full border-2 bg-neutral-500 transition-colors ${
                active === "default"
                  ? "border-foreground"
                  : "border-transparent hover:border-muted-foreground/50"
              }`}
              title="Default"
            >
              {active === "default" && <Check className="size-4 text-white" />}
            </button>
          </fetcher.Form>

          {/* Color swatches */}
          {(Object.keys(THEME_COLORS) as Exclude<ColorTheme, "default">[]).map((theme) => (
            <fetcher.Form key={theme} method="POST" action="/resources/color-theme">
              <input type="hidden" name="colorTheme" value={theme} />
              <button
                type="submit"
                className={`relative flex size-8 items-center justify-center rounded-full border-2 ${THEME_COLORS[theme]} transition-colors ${
                  active === theme
                    ? "border-foreground"
                    : "border-transparent hover:border-muted-foreground/50"
                }`}
                title={theme.charAt(0).toUpperCase() + theme.slice(1)}
              >
                {active === theme && <Check className="size-4 text-white" />}
              </button>
            </fetcher.Form>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
