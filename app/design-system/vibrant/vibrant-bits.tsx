"use client";
// Vibrant v2 micro-interactions (mockup-local). Both honor prefers-reduced-motion AND the low
// device tier (instant/static). Count-up is for learning/progress/streak/cert numbers ONLY —
// NEVER money (DecisionCard §7 lock: money is static; the mockup keeps ₹ via <DataValue>).
import { useEffect, useRef, useState } from "react";
import { ProgressRing } from "../../../components/data/progress-ring";

function motionOk(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  return document.documentElement.dataset.deviceTier !== "low";
}

/** Animated count-up for NON-money numbers. SSR/no-motion renders the final value instantly. */
export function CountUp({
  value,
  duration = 700,
}: {
  value: number;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!motionOk() || value <= 0) return;
    setShown(0);
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{shown}</>;
}

/** Ring that fills from 0 → value on mount (the CSS dashoffset transition does the easing). */
export function AnimatedRing(props: React.ComponentProps<typeof ProgressRing>) {
  const [value, setValue] = useState(() => props.value);
  useEffect(() => {
    if (!motionOk() || props.value <= 0) return;
    setValue(0);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setValue(props.value)),
    );
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <ProgressRing {...props} value={value} />;
}
