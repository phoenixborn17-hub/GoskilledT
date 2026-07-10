"use client";
// Animated counter — counts up to a REAL value (D-29: caller must pass real data only; this is a
// presentation of a true number, never a fabricated stat). Count-up runs once on scroll-into-view,
// on capable tier only; low tier / reduced-motion / no-IntersectionObserver → the final value is
// shown immediately (never a fake "0 → …" animation blocking the truth). transform-free, no CLS.
import * as React from "react";
import { useDeviceTier } from "../system/device-tier-provider";

export function StatCounter({
  value,
  suffix = "",
  prefix = "",
  durationMs = 900,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  durationMs?: number;
}) {
  const tier = useDeviceTier();
  const ref = React.useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = React.useState<number>(value);

  React.useEffect(() => {
    // Capable tier only, and only if IO exists. Otherwise the true value is already rendered.
    if (tier === "low" || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }
    const node = ref.current;
    if (!node) return;
    let raf = 0;
    let start = 0;
    let ran = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || ran) return;
        ran = true;
        setDisplay(0);
        const step = (t: number) => {
          if (!start) start = t;
          const k = Math.min(1, (t - start) / durationMs);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - k, 3);
          setDisplay(Math.round(eased * value));
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tier, value, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
