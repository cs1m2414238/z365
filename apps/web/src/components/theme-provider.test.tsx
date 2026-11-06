import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, ThemeSwitcher } from "./theme-provider";
import { isTheme, normalizeTheme } from "@/lib/theme-context";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = "";
});
afterEach(cleanup);

function mount() {
  return render(
    <ThemeProvider>
      <ThemeSwitcher />
    </ThemeProvider>,
  );
}

describe("dashboard themes", () => {
  it("switches directly between Light and the Focus dark palette with one toggle", () => {
    mount();
    const toggle = screen.getByRole("button", { name: "Dark mode" });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.title).toBe("Switch to light mode");
    expect(document.documentElement.dataset.theme).toBe("focus");
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByRole("group", { name: "Color theme" })).toBeNull();

    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(localStorage.getItem("z365.theme.v1")).toBe("light");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.title).toBe("Switch to dark mode");

    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("focus");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("z365.theme.v1")).toBe("focus");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("restores the saved Light preference after remounting", () => {
    localStorage.setItem("z365.theme.v1", "light");
    const first = mount();
    expect(document.documentElement.dataset.theme).toBe("light");
    first.unmount();
    mount();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(
      screen
        .getByRole("button", { name: "Dark mode" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("syncs choices across tabs and ignores invalid stored values", () => {
    mount();
    fireEvent(
      window,
      new StorageEvent("storage", { key: "z365.theme.v1", newValue: "light" }),
    );
    expect(document.documentElement.dataset.theme).toBe("light");
    fireEvent(
      window,
      new StorageEvent("storage", {
        key: "z365.theme.v1",
        newValue: "unexpected-value",
      }),
    );
    expect(document.documentElement.dataset.theme).toBe("light");
    fireEvent(
      window,
      new StorageEvent("storage", { key: "z365.theme.v1", newValue: "night" }),
    );
    expect(document.documentElement.dataset.theme).toBe("focus");
    expect(isTheme("night")).toBe(false);
    expect(isTheme("focus")).toBe(true);
    expect(isTheme("dark")).toBe(false);
    expect(isTheme("unexpected-value")).toBe(false);
  });

  it.each(["dark", "night"])(
    "migrates a saved %s preference to Dark",
    (legacy) => {
      localStorage.setItem("z365.theme.v1", legacy);
      mount();
      expect(document.documentElement.dataset.theme).toBe("focus");
      expect(localStorage.getItem("z365.theme.v1")).toBe("focus");
      expect(normalizeTheme(legacy)).toBe("focus");
      expect(normalizeTheme("unexpected-value")).toBeUndefined();
    },
  );
});
