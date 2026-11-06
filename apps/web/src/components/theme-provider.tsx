import {
  initialTheme,
  normalizeTheme,
  ThemeContext,
  useTheme,
  type Theme,
} from "@/lib/theme-context";
import { useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "light" ? "light" : "dark";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#f7f8fa" : "#0b0c0c");
    try {
      localStorage.setItem("z365.theme.v1", theme);
    } catch {
      /* Theme changes still work for this session. */
    }
  }, [theme]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      const next = normalizeTheme(event.newValue);
      if (event.key === "z365.theme.v1" && next) setTheme(next);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "focus";
  const Icon = dark ? Moon : Sun;
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      aria-label="Dark mode"
      aria-pressed={dark}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
      onClick={() => setTheme(dark ? "light" : "focus")}
    >
      <Icon size={18} strokeWidth={1.6} />
    </button>
  );
}
