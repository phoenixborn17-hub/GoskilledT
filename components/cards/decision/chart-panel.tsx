import * as React from "react";
import Link from "next/link";
import { type LucideIcon, ArrowRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import { DecisionCard, type CardAccent } from "./decision-card";

export interface ChartPanelProps {
  icon: LucideIcon;
  title: string;
  accent?: CardAccent;
  /** Rendered top-right (a range hint like "Last 14 days" or a filter control). */
  meta?: React.ReactNode;
  /** The chart (AreaChart / Sparkline / lazy Chart.js). Only rendered when `ready` is true —
   *  callers enforce the ≥3-points / all-zero rule and pass `ready={false}` otherwise. */
  chart: React.ReactNode;
  /** false → the honest unlock shell renders instead of the chart (rich-honest-zero, full-size —
   *  a zero state is the same panel at zero, never a smaller one). */
  ready: boolean;
  /** ThreeState unlock micro-line shown when not ready, e.g. "Your momentum graph starts with
   *  your first lesson." Real, motivating, never a fabricated curve (D-29). */
  unlockLine: string;
  unlockCta?: { label: string; href: string };
  /** Accessible text fallback for the ready chart (Experience System §9/§13) — a one-line
   *  data summary for screen readers, e.g. "9 lessons completed over the last 14 days". */
  summary?: string;
  index?: number;
  className?: string;
}

/**
 * ChartPanel (Command_Center_Spec §2.5 / §5.3) — the analytics band panel, composed on the
 * DecisionCard shell (NOT a new system): same depth recipe, device-tiering, and honest states.
 * Ready → header + chart + sr-only summary. Not ready → the SAME full-size panel with the
 * unlock line + one CTA (rich-honest-zero; the chart area never shrinks or fabricates).
 */
export function ChartPanel({
  icon,
  title,
  accent = "green",
  meta,
  chart,
  ready,
  unlockLine,
  unlockCta,
  summary,
  index,
  className,
}: ChartPanelProps) {
  return (
    <DecisionCard
      icon={icon}
      label={title}
      accent={accent}
      size="wide"
      index={index}
      className={cn("min-h-[11rem]", className)}
    >
      {meta && (
        <div className="-mt-2 mb-2 text-caption text-ink-muted">{meta}</div>
      )}
      {ready ? (
        <>
          <div aria-hidden={summary ? true : undefined}>{chart}</div>
          {summary && <p className="sr-only">{summary}</p>}
        </>
      ) : (
        <div className="flex h-full min-h-[6.5rem] flex-col items-start justify-center gap-2">
          <p className="max-w-prose text-body text-ink-muted">{unlockLine}</p>
          {unlockCta && (
            <Link
              href={unlockCta.href}
              className="inline-flex items-center gap-1 rounded text-small font-semibold text-theme-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2"
            >
              {unlockCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </DecisionCard>
  );
}
