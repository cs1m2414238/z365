import { createContext, useContext } from "react";

export const themes = ["light", "focus"] as const;
export type Theme = (typeof themes)[number];
export const isTheme = (value: unknown): value is Theme =>
  themes.includes(value as Theme);
export const normalizeTheme = (value: unknown): Theme | undefined =>
  value === "dark" || value === "night"
    ? "focus"
    : isTheme(value)
      ? value
      : undefined;
export function initialTheme(): Theme {
  try {
    const saved = normalizeTheme(localStorage.getItem("z365.theme.v1"));
    if (saved) return saved;
  } catch {
    /* Use the prepaint document mode or the Focus default. */
  }
  return normalizeTheme(document.documentElement.dataset.theme) ?? "focus";
}
export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: "focus", setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);
