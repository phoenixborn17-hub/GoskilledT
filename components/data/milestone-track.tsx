import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface MilestoneTrackProps {
  /** Total milestones on the track. */
  total: number;
  /** How many are reached (0..total). */
  reached: number;
  /** Optional per-milestone labels (tiers). */
  labels?: string[];
  className?: string;
}

/**
 * Milestone track (DecisionCard_System §6 — Rewards family). A stepped track: reached nodes carry
 * the accent + a ✓, the next node is ringed (the target), future nodes are muted. Real counts only.
 */
export function MilestoneTrack({
  total,
  reached,
  labels,
  className,
}: MilestoneTrackProps) {
  const nodes = Array.from({ length: Math.max(total, 1) });
  const clampedReached = Math.max(0, Math.min(total, reached));
  return (
    <div className={cn("flex items-start", className)}>
      {nodes.map((_, i) => {
        const done = i < clampedReached;
        const target = i === clampedReached;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <span className="relative inline-flex">
                {/* The target node carries the Spark halo — "your next step". */}
                {target && (
                  <span
                    className="dc-spark-halo absolute -inset-1.5 rounded-full"
                    style={{ background: "var(--card-accent)" }}
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "relative flex h-7 w-7 items-center justify-center rounded-full border-2 text-caption font-bold",
                    done &&
                      "border-transparent bg-[color:var(--card-accent)] text-white",
                    target &&
                      "border-[color:var(--card-accent)] text-[color:var(--card-accent)]",
                    !done && !target && "border-n-300 text-ink-muted",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                </span>
              </span>
              {labels?.[i] && (
                <span
                  className={cn(
                    "max-w-[4.5rem] text-center text-caption",
                    done || target
                      ? "font-semibold text-ink"
                      : "text-ink-muted",
                  )}
                >
                  {labels[i]}
                </span>
              )}
            </div>
            {i < nodes.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mt-3.5 h-0.5 flex-1",
                  i < clampedReached
                    ? "bg-[color:var(--card-accent)]"
                    : "bg-n-150",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
