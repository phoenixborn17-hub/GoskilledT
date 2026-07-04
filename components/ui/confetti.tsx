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
        @keyframes gs-confetti { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1 } 100% { transform: translateY(110vh) rotate(540deg); opacity: 0 } }
      `}</style>
      {Array.from({ length: 16 }, (_, i) => {
        const left = (i * 6.1 + 5) % 100;
        const delay = (i % 5) * 90;
        const duration = 1100 + (i % 4) * 150;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: `${left}%`,
              width: 8,
              height: 12,
              borderRadius: 2,
              background: COLORS[i % COLORS.length],
              animation: `gs-confetti ${duration}ms ${delay}ms ease-in forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
