"use client";
// Scroll-progress bar (top hairline). Communicates "how far through the story am I" — a purposeful
// reading affordance, not decoration. Passive scroll listener, transform-only (60fps, CLS 0).
// Device-tiered: hidden on low tier / reduced-motion (no value there; keeps low-end paint clean).
import * as React from "react";
import { useDeviceTier } from "../system/device-tier-provider";

export function ScrollProgress() {
  const tier = useDeviceTier();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (tier === "low") return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tier]);

  if (tier === "low") return null;
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-brand to-green-500"
      ref={ref}
    />
  );
}
