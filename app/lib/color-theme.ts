export const COLOR_THEMES = [
  "default",
  "blue",
  "green",
  "rose",
  "orange",
  "violet",
  "yellow",
] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number];

export function isColorTheme(value: unknown): value is ColorTheme {
  return COLOR_THEMES.includes(value as ColorTheme);
}
