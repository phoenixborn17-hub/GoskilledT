import * as React from "react";
import { TrendingUp, TrendingDown, LineChart } from "lucide-react";
import { cn } from "../../../lib/utils";
import { DecisionCard, type CardSize } from "./decision-card";
import { AreaChart } from "../../data/area-chart";
import { StatValue } from "../../data/stat-value";

export interface AnalyticsCardProps {
  label: string;
  headline: number;
  headlineSuffix?: string;
  /** Real series. ≥3-points rule (§6): below 3, the card shows the stat + an honest line. */
  points: number[];
  deltaPct?: number;
  aiLine?: string | null;
  href: string;
  size?: CardSize;
  index?: number;
  state?: "ready" | "loading" | "error";
  onRetry?: () => void;
}

/**
 * Analytics (wide, neutral) — signature viz = the gradient area chart. Headline number counts up
 * (non-money); trend colour is semantic + icon-paired. Below 3 points it degrades to a stat + an
 * honest "graph appears after…" line — never a fabricated 1–2 point curve (D-29).
 */
export function AnalyticsCard({
  label,
  headline,
  headlineSuffix,
  points,
  deltaPct,
  aiLine,
  href,
  size = "wide",
  index,
  state,
  onRetry,
}: AnalyticsCardProps) {
  const hasDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct);
  const up = hasDelta && deltaPct! >= 0;
  const enoughData = points && points.length >= 3;

  return (
    <DecisionCard
      icon={LineChart}
      label={label}
      accent="neutral"
      size={size}
      aiLine={aiLine}
      cta="Open analytics"
      href={href}
      index={index}
      state={state}
      onRetry={onRetry}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <div className="dc-number text-h1 font-bold text-ink">
            <StatValue value={headline} countUp />
            {headlineSuffix && (
              <span className="dc-unit ml-0.5 font-semibold text-ink-muted">
                {headlineSuffix}
              </span>
            )}
          </div>
          {hasDelta && (
            <div
              className={cn(
                "mt-1 inline-flex items-center gap-1 text-caption font-semibold",
                up ? "text-success" : "text-danger",
              )}
            >
              {up ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden />
              )}
              {up ? "+" : ""}
              {deltaPct!.toFixed(1)}% vs last period
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {enoughData ? (
            <AreaChart
              points={points}
              height={96}
              color="var(--gs-green)"
              label={`${label} trend`}
            />
          ) : (
            <p className="text-caption text-ink-muted">
              This graph appears once you have a few days of activity.
            </p>
          )}
        </div>
      </div>
    </DecisionCard>
  );
}
