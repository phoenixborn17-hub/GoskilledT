import * as React from "react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { DataValue } from "../data/data-value";
import { Sparkline } from "../data/sparkline";
import type { SafeDisplay } from "../../lib/format";

/**
 * Card families (Experience System §10.2). `financial` = gold accent only, value stays charcoal
 * (never gold text on light, Golden Rule 14); `learning` = green accent; `analytics` = neutral.
 */
type Family = "learning" | "financial" | "analytics";

const accent: Record<Family, string> = {
  learning: "bg-theme/10 text-theme-strong",
  financial: "bg-gold-400/20 text-warning-strong",
  analytics: "bg-charcoal/5 text-ink",
};

export interface StatCardProps {
  label: string;
  /** The value — ALWAYS a SafeDisplay (safeMoney/safeCount) so failure → Retry, never ₹0 (§B). */
  value: SafeDisplay;
  icon?: LucideIcon;
  family?: Family;
  /** Small context line under the value (e.g. "Buyer-protected for 48h"). */
  hint?: string;
  /** Real trend only (≥3 points enforced by Sparkline; delta paired with an icon). */
  trend?: { points?: number[]; deltaPct?: number };
  state?: "loading" | "ready" | "error";
  onRetry?: () => void;
  className?: string;
}

/**
 * The workspace stat card (courses/%/certs/streak · balance/held/earned/refs). Loading = skeleton
 * number (never a ₹0 flatline); error = calm retry; ready = fail-safe <DataValue>. No count-up on
 * money — money renders as a stable figure (Amendments §D).
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  family = "learning",
  hint,
  trend,
  state = "ready",
  onRetry,
  className,
}: StatCardProps) {
  const hasDelta =
    trend &&
    typeof trend.deltaPct === "number" &&
    Number.isFinite(trend.deltaPct);
  const up = hasDelta && trend!.deltaPct! >= 0;

  return (
    <Card elevation="raised" className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-caption font-semibold uppercase tracking-wide text-ink-muted">
            {label}
          </p>
          <div className="mt-2 font-heading text-h2 font-bold tabular-nums text-ink">
            {state === "loading" ? (
              <Skeleton className="h-8 w-24" />
            ) : state === "error" ? (
              <DataValue value={{ ok: false }} onRetry={onRetry} />
            ) : (
              <DataValue value={value} onRetry={onRetry} />
            )}
          </div>
          {hint && state === "ready" && (
            <p className="mt-1.5 text-caption text-ink-muted">{hint}</p>
          )}
        </div>
        {Icon && (
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              accent[family],
            )}
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {state === "ready" && trend && (
        <div className="mt-4 flex items-center justify-between gap-3">
          {trend.points && trend.points.length >= 3 && (
            <Sparkline points={trend.points} label={`${label} trend`} />
          )}
          {hasDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-caption font-semibold",
                up ? "text-success" : "text-danger",
              )}
            >
              {up ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden />
              )}
              {up ? "+" : ""}
              {trend!.deltaPct!.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
