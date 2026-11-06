import { useEffect, useState } from "react";

function readEnvironment() {
  if (typeof window === "undefined" || !window.matchMedia)
    return { allowed: false, reduced: true };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    reduced,
    allowed:
      !reduced &&
      window.matchMedia("(min-width: 801px)").matches &&
      document.visibilityState === "visible",
  };
}

/** Keeps the decorative greeting local and idle in reduced-motion/hidden/mobile views. */
export function useTypewriter(value: string, enabled: boolean) {
  const [environment, setEnvironment] = useState(readEnvironment);
  const [frame, setFrame] = useState({ source: value, length: 0 });
  const animated = enabled && environment.allowed;

  useEffect(() => {
    if (!window.matchMedia) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 801px)");
    const sync = () => setEnvironment(readEnvironment());
    motion.addEventListener("change", sync);
    desktop.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      motion.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    if (!animated) return;
    let length = 0;
    let direction = 1;
    let timer: ReturnType<typeof setTimeout>;
    setFrame({ source: value, length: 0 });
    const tick = () => {
      length = Math.max(0, Math.min(value.length, length + direction));
      setFrame({ source: value, length });
      let delay = direction === 1 ? 38 : 18;
      if (length === value.length) {
        direction = -1;
        delay = 2400;
      } else if (length === 0) {
        direction = 1;
        delay = 400;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 250);
    return () => clearTimeout(timer);
  }, [value, animated]);

  return {
    text: animated
      ? value.slice(0, frame.source === value ? frame.length : 0)
      : value,
    animated,
    reducedMotion: environment.reduced,
  };
}
