"use client";
// Purposeful-delight confetti (DR-030 §5 · DESIGN_DIRECTION: every effect has a purpose). Fired
// once when a lesson is marked complete. Self-contained (styles inlined — no globals.css change)
// and fully silent under `prefers-reduced-motion: reduce` (WCAG / DESIGN_DIRECTION motion rule).
import { useEffect, useState } from "react";

const COLORS = ["#137E49", "#EDC825", "#0C5A34"]; // gs-green · gs-gold · gs-green-deep

export function Confetti({ fire }: { fire: boolean }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!fire) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // honour reduced motion — no animation at all
    setOn(true);
    const t = setTimeout(() => setOn(false), 1400);
    return () => clearTimeout(t);
  }, [fire]);

  if (!on) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      <style>{`
        @keyframes gs-confetti {
          0%   { transform: translateY(-12vh) translateX(0) rotate(0deg); opacity: 1 }
          100% { transform: translateY(110vh) translateX(var(--drift, 0px)) rotate(var(--spin, 540deg)); opacity: 0 }
        }
      `}</style>
      {Array.from({ length: 24 }, (_, i) => {
        const left = (i * 4.05 + 3) % 100;
        const delay = (i % 6) * 80;
        const duration = 1150 + (i % 5) * 160;
        // Drift outward from centre + varied shapes/sizes → a fuller, moment-grade burst.
        const drift = (left < 50 ? -1 : 1) * (12 + (i % 4) * 16);
        const spin = (i % 2 ? 1 : -1) * (420 + (i % 3) * 180);
        const strip = i % 3 === 0; // some thin ribbons, some chips
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: `${left}%`,
              width: strip ? 5 : 9,
              height: strip ? 14 : 9,
              borderRadius: strip ? 1 : 2,
              background: COLORS[i % COLORS.length],
              ["--drift" as string]: `${drift}px`,
              ["--spin" as string]: `${spin}deg`,
              animation: `gs-confetti ${duration}ms ${delay}ms cubic-bezier(0.3, 0.7, 0.4, 1) forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
