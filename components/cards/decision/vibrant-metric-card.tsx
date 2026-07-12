import * as React from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Spark } from "../../data/spark";

/**
 * VibrantMetricCard (Vibrant Card System v1.0 — promoted from the founder-locked v5 preview; see
 * docs/specs/Vibrant_CardSystem_Amendment_v1.0.md). The colorful sibling of MetricCard: same
 * anatomy (icon plate · caps label · big value · mini-viz · delta/caption), rendered on the
 * .vh-* recipe — soft accent gradient-tinted body by default, or a saturated FOCAL identity with
 * `bold` (emerald / gold-vault / indigo / royal-purple per accent). Depth, hover (lift + scale +
 * glow + icon pop), borders, and the low-device-tier flatten all live in globals.css.
 *
 * Honesty contract (same as every card): values are real or honest-zero; money must arrive as a
 * STATIC <DataValue> node (never <CountUp> — DecisionCard §7); the earn accents render only on
 * surfaces the eligibility fork already gates. The `live` Spark fires on honest triggers only.
 * A11y: whole-card link with a visible focus ring; text on soft tints is ink (AA), on bold focals
 * white or gilded #E6C875 (AA on the dark fills); viz slots must carry their own aria-labels.
 */
export function VibrantMetricCard({
  accent,
  bold = false,
  index = 0,
  icon: Icon,
  label,
  value,
  viz,
  delta,
  caption,
  live = false,
  href,
  badge,
  className = "",
  numClassName = "",
}: {
  /** vh-accent-learn | vh-accent-earn | vh-accent-network | vh-accent-achieve | vh-accent-streak | vh-accent-cyan */
  accent: string;
  /** Saturated focal identity (use for the 2–4 most important cards; keep the rest soft). */
  bold?: boolean;
  /** Entrance-stagger index (capped; ignored under reduced-motion/low tier). */
  index?: number;
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  /** Mini-viz slot (ring / heat strip / mini-bars / nodes) — colored by the accent. */
  viz?: React.ReactNode;
  /** Honest delta chip ("▲ 5 lessons this week") — omit when there is no real delta. */
  delta?: string | null;
  /** ThreeState caption (real context or the honest-zero unlock line). */
  caption?: string | null;
  /** Honest live-edge Spark on the label. */
  live?: boolean;
  href: string;
  badge?: string;
  /** Grid span / sizing hooks (hierarchy — a few larger focal cards + smaller supporting). */
  className?: string;
  /** Extra classes for the big value (e.g. metallic vh-gold-num on the gold-vault focal). */
  numClassName?: string;
}) {
  const ink = bold ? "text-white" : "text-ink";
  const muted = bold ? "text-white/80" : "text-ink-muted";
  return (
    <Link
      href={href}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className={`vh-card dc-enter ${accent} ${bold ? "vh-bold" : "vh-soft"} flex h-full flex-col p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2 md:p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`${bold ? "vh-plate" : "vh-plate-grad"} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        {badge && (
          <span className="vh-delta rounded-full px-2 py-0.5 text-caption font-bold uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        {live ? (
          <span className={bold ? "text-white" : "vh-text"}>
            <Spark size={6} />
          </span>
        ) : null}
        <p
          className={`font-heading text-caption font-bold uppercase tracking-wide ${bold ? "text-white/85" : muted}`}
        >
          {label}
        </p>
      </div>
      <div className="mt-1.5 flex flex-1 items-end justify-between gap-3">
        <p
          className={`dc-number text-h2 font-bold leading-none md:text-h1 ${ink} ${numClassName}`}
        >
          {value}
        </p>
        {viz && (
          <div className={`shrink-0 pb-0.5 ${bold ? "text-white" : "vh-text"}`}>
            {viz}
          </div>
        )}
      </div>
      {delta ? (
        <p className="vh-delta mt-2 inline-flex w-fit rounded-full px-2.5 py-1 text-caption font-semibold">
          {delta}
        </p>
      ) : caption ? (
        <p className={`mt-2 text-caption leading-snug ${muted}`}>{caption}</p>
      ) : null}
    </Link>
  );
}
