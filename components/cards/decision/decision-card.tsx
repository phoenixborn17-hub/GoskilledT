import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Flame, type LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Skeleton } from "../../ui/skeleton";
import { ErrorState } from "../../ui/error-state";
import { Spark } from "../../data/spark";

export type CardAccent = "green" | "gold" | "info" | "neutral";
export type CardSize = "hero" | "primary" | "secondary" | "wide" | "metric";

export interface DecisionCardProps {
  icon: LucideIcon;
  label: string;
  accent?: CardAccent;
  size?: CardSize;
  badge?: { label: string; tone?: "live" | "new" | "hot" };
  /** In-card AI nudge — real trigger only. Pass null/undefined to omit the line entirely (D-29). */
  aiLine?: string | null;
  /** Live-edge (Command_Center_Spec §2.4): the label tick becomes the breathing Spark. HONEST
   *  trigger only (streak alive today · lesson in progress · money moved) — absence is information. */
  live?: boolean;
  /** One action per card. The whole card is the link; this is the visual affordance. */
  cta?: string;
  href?: string;
  /** Honest states baked in. Error renders a non-link retry surface. */
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
  /** Hero + signature-viz zone. */
  children?: React.ReactNode;
  /** Stagger index → animation-delay for the load-in (capable tier only). */
  index?: number;
  className?: string;
}

const accentClass: Record<CardAccent, string> = {
  green: "dc-accent-green",
  gold: "dc-accent-gold",
  info: "dc-accent-info",
  neutral: "dc-accent-neutral",
};

const sizePad: Record<CardSize, string> = {
  hero: "p-6 md:min-h-[13rem] md:p-7",
  primary: "p-5",
  secondary: "p-5",
  wide: "p-6",
  metric: "p-4 md:p-5",
};

function CardBadge({
  label,
  tone = "new",
}: NonNullable<DecisionCardProps["badge"]>) {
  if (tone === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-caption font-bold uppercase tracking-wide text-success">
        <span
          className="dc-glow h-1.5 w-1.5 rounded-full bg-success"
          aria-hidden
        />
        {label}
      </span>
    );
  }
  if (tone === "hot") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gold-400/20 px-2.5 py-1 text-caption font-bold uppercase tracking-wide text-warning-strong">
        <Flame className="h-3.5 w-3.5" aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-theme/10 px-2.5 py-1 text-caption font-bold uppercase tracking-wide text-theme-strong">
      {label}
    </span>
  );
}

/**
 * The Decision Card shell (DecisionCard_System §1) — the shared GoSkilled soul that each family
 * fills differently: embedded (non-floating) icon plate, label + optional badge, a hero/viz zone
 * (children), an in-card AI line (real trigger only), and exactly one CTA — with the WHOLE card
 * clickable. Premium paper-layer depth + hover live in globals.css and degrade on low device-tier.
 * Honest states are built in (loading skeleton; calm error+retry, rendered as a non-link surface).
 */
export function DecisionCard({
  icon: Icon,
  label,
  accent = "green",
  size = "primary",
  badge,
  aiLine,
  live = false,
  cta,
  href,
  state = "ready",
  onRetry,
  children,
  index = 0,
  className,
}: DecisionCardProps) {
  const shell = cn(
    "decision-card dc-enter flex h-full flex-col",
    accentClass[accent],
    `dc-size-${size}`,
    sizePad[size],
    className,
  );
  // Stagger the load-in (capped so late cards don't lag); ignored under reduced-motion/low tier.
  const style = {
    animationDelay: `${Math.min(index, 8) * 55}ms`,
  } as React.CSSProperties;

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "dc-icon dc-icon-plate flex shrink-0 items-center justify-center rounded-xl",
            size === "metric" ? "h-10 w-10" : "h-11 w-11",
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          {/* Live-edge: the static tick becomes the breathing Spark (honest trigger only). */}
          {live ? (
            <span style={{ color: "var(--card-accent)" }}>
              <Spark size={6} />
            </span>
          ) : (
            <span className="dc-tick shrink-0" aria-hidden />
          )}
          <span className="truncate font-heading text-small font-semibold text-ink">
            {label}
          </span>
        </span>
      </div>
      {badge && <CardBadge {...badge} />}
    </div>
  );

  // Error = honest, non-link retry surface (never a dead end, never a fabricated figure).
  if (state === "error") {
    return (
      <div className={shell} style={style}>
        {header}
        <ErrorState onRetry={onRetry} className="flex-1 justify-center py-6" />
      </div>
    );
  }

  const body =
    state === "loading" ? (
      <div className="mt-5 flex-1 space-y-3" aria-busy>
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-16 w-full" />
      </div>
    ) : (
      <>
        <div className={cn("flex-1", size === "metric" ? "mt-3" : "mt-4")}>
          {children}
        </div>
        {aiLine ? (
          <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-info/5 px-2.5 py-2 text-caption text-ink-muted">
            <Sparkles
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info"
              aria-hidden
            />
            <span>{aiLine}</span>
          </p>
        ) : null}
        {cta && (
          <div className="mt-4 inline-flex items-center gap-1 text-small font-semibold dc-accent-text">
            {cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </div>
        )}
      </>
    );

  if (href) {
    return (
      <Link
        href={href}
        style={style}
        className={cn(
          shell,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2",
        )}
      >
        {header}
        {body}
      </Link>
    );
  }

  return (
    <div className={shell} style={style}>
      {header}
      {body}
    </div>
  );
}
