import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useTypewriter } from "./use-typewriter";

let reduced = false;
beforeEach(() => {
  reduced = false;
  vi.useFakeTimers();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduced-motion") ? reduced : true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("greeting typewriter", () => {
  it("types the current greeting and clears its timers when unmounted", () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useTypewriter(value, true),
      { initialProps: { value: "Welcome, Maya." } },
    );
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(result.current.text.length).toBeGreaterThan(0);
    expect(result.current.text.length).toBeLessThan("Welcome, Maya.".length);
    rerender({ value: "Welcome back, Noor." });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.text).toBe("Welcome back, Noor.");
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("shows the full greeting and stops all typing when paused", () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useTypewriter("Welcome, Maya.", enabled),
      { initialProps: { enabled: true } },
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender({ enabled: false });
    expect(result.current.text).toBe("Welcome, Maya.");
    expect(result.current.animated).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("respects reduced motion without creating animation timers", () => {
    reduced = true;
    const { result } = renderHook(() => useTypewriter("Welcome, Maya.", true));
    expect(result.current.text).toBe("Welcome, Maya.");
    expect(result.current.reducedMotion).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
