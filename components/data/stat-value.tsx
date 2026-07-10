"use client";
import * as React from "react";
import { cn } from "../../lib/utils";
import { useDeviceTier } from "../system/device-tier-provider";

export interface StatValueProps {
  /** The numeric value to display. */
  value: number;
  /** Format the number for display (default: Indian grouping). */
  format?: (n: number) => string;
  /**
   * Count up from 0 on first paint (Level-2 motion, DESIGN §10). MUST stay false for money
   * (Amendments §D — no count-up on money); use only for learning stats. Auto-disabled on low
   * device-tier / reduced-motion.
   */
  countUp?: boolean;
  className?: string;
}

const defaultFormat = (n: number) => new Intl.NumberFormat("en-IN").format(n);

/**
 * Large tabular-num stat number. Optional count-up is gated on device-tier AND reduced-motion, and
 * must never be enabled for currency (that lives behind <DataValue>). Real data only (D-29).
 */
export function StatValue({
  value,
  format = defaultFormat,
  countUp = false,
  className,
}: StatValueProps) {
  const tier = useDeviceTier();
  const [display, setDisplay] = React.useState(countUp ? 0 : value);

  React.useEffect(() => {
    if (!countUp || tier === "low") {
      setDisplay(value);
      return;
    }
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const duration = 600;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const progress = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, countUp, tier]);

  return (
    <span className={cn("tabular-nums", className)}>{format(display)}</span>
  );
}
