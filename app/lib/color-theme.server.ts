import * as cookie from "cookie";
import { isColorTheme } from "./color-theme";
import type { ColorTheme } from "./color-theme";

export type { ColorTheme };
export { COLOR_THEMES, isColorTheme } from "./color-theme";

const cookieName = "color_theme";

export function getColorTheme(request: Request): ColorTheme {
  const cookieHeader = request.headers.get("cookie");
  const parsed = cookieHeader ? cookie.parse(cookieHeader)[cookieName] : null;
  if (parsed && isColorTheme(parsed)) return parsed;
  return "default";
}

export function setColorTheme(colorTheme: ColorTheme) {
  if (colorTheme === "default") {
    return cookie.serialize(cookieName, "", { path: "/", maxAge: -1 });
  }
  return cookie.serialize(cookieName, colorTheme, {
    path: "/",
    maxAge: 31_536_000,
  });
}
