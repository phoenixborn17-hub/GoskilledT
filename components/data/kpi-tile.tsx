import * as React from "react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface KpiTileProps {
  label: string;
  /** Pre-formatted value node — use <DataValue> for money/counts so failure is fail-safe. */
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Signed percentage change vs previous period (real data). Omit if none. */
  deltaPct?: number;
  className?: string;
}

/**
 * Compact KPI tile (label + big value + optional real trend) for dense admin/analytics rows.
 * Trend colour is semantic + always paired with an icon (never colour-only, §9 functional colour).
 */
export function KpiTile({
  label,
  value,
  icon: Icon,
  deltaPct,
  className,
}: KpiTileProps) {
  const hasDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct);
  const up = hasDelta && deltaPct! >= 0;
  return (
    <div
      className={cn(
        "rounded-gs border border-line bg-surface-raised p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-caption font-medium text-ink-muted">
        {Icon && <Icon className="h-4 w-4" aria-hidden />}
        {label}
      </div>
      <div className="mt-2 font-heading text-h3 font-bold tabular-nums text-ink">
        {value}
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
          {deltaPct!.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
