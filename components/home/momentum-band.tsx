// Momentum band (Command_Center_Spec §2.5 · Vibrant Card System v1.0) — the Home visual-analytics
// band, streamed below the first viewport. Learning momentum for EVERYONE; the earn trend ONLY for
// eligible affiliates (the loader returns null otherwise — the learning panel then takes the full
// width; recomposition, never a locked teaser). Panels wear the vibrant soft recipe with the
// glow-edged hero chart; honest full-size unlock shells at zero (never a shrunken box, never a
// fabricated curve — D-29). Money figures stay charcoal/static; gold is the frame (DR-043 copy).
import Link from "next/link";
import { TrendingUp, Coins, ArrowRight, type LucideIcon } from "lucide-react";
import { getHomeMomentum } from "../../lib/home/momentum";
import { formatINRFromPaise } from "../../lib/format";
import { AreaChart } from "../data/area-chart";
import { CountUp } from "../data/animated";

export async function MomentumBand({ userId }: { userId: string }) {
  const m = await getHomeMomentum(userId);
  const twoUp = m.earn !== null;

  return (
    <section aria-label="Your momentum">
      <h2 className="mb-3 font-heading text-h4 font-bold text-ink">
        Your momentum
      </h2>
      <div className={twoUp ? "grid gap-4 lg:grid-cols-2" : "grid gap-4"}>
        <MomentumPanel
          accent="vh-accent-learn"
          icon={TrendingUp}
          title="Learning activity"
          meta="Last 14 days"
          headline={
            m.learningTotal > 0 ? (
              <>
                <CountUp value={m.learningTotal} />
                <span className="dc-unit">
                  {m.learningTotal === 1 ? "lesson" : "lessons"}
                </span>
              </>
            ) : null
          }
        >
          {m.learningTotal > 0 ? (
            <>
              <AreaChart
                points={m.learning}
                height={104}
                color="#137E49"
                label="Lessons completed per day, last 14 days"
              />
              <p className="sr-only">
                {m.learningTotal} {m.learningTotal === 1 ? "lesson" : "lessons"}{" "}
                completed over the last 14 days
              </p>
            </>
          ) : (
            <UnlockShell
              line="Your momentum graph starts with your first lesson."
              cta={{ label: "Start learning", href: "/dashboard/learn" }}
            />
          )}
        </MomentumPanel>

        {m.earn && (
          <MomentumPanel
            accent="vh-accent-earn"
            icon={Coins}
            title="Recorded earnings"
            meta="Last 14 days · recorded to your wallet"
          >
            {m.earn.totalInPaise > 0 ? (
              <>
                <AreaChart
                  points={m.earn.series}
                  height={104}
                  color="#B8860B"
                  label="Commission recorded per day, last 14 days"
                />
                <p className="sr-only">
                  {formatINRFromPaise(m.earn.totalInPaise)} recorded over the
                  last 14 days
                </p>
              </>
            ) : (
              <UnlockShell
                line="Your earnings trend appears with your first recorded commission."
                cta={{ label: "Open Earn", href: "/dashboard/earn" }}
              />
            )}
          </MomentumPanel>
        )}
      </div>
    </section>
  );
}

function MomentumPanel({
  accent,
  icon: Icon,
  title,
  meta,
  headline,
  children,
}: {
  accent: string;
  icon: LucideIcon;
  title: string;
  meta?: string;
  /** Big NON-money number (CountUp allowed); money panels omit it — figures live in the chart. */
  headline?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`vh-card vh-soft ${accent} vh-chart-glow dc-enter p-5`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="vh-plate-grad flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-heading text-caption font-bold uppercase tracking-wide text-ink-muted">
              {title}
            </h3>
            {meta && <p className="text-caption text-ink-muted">{meta}</p>}
          </div>
        </div>
        {headline && (
          <p className="dc-number text-h2 font-bold leading-none text-ink">
            {headline}
          </p>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function UnlockShell({
  line,
  cta,
}: {
  line: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="flex min-h-[6.5rem] flex-col items-start justify-center gap-2">
      <p className="max-w-prose text-body text-ink-muted">{line}</p>
      <Link
        href={cta.href}
        className="inline-flex items-center gap-1 rounded text-small font-semibold text-theme-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2"
      >
        {cta.label}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

/** Suspense fallback — mirrors the band's footprint (zero CLS). */
export function MomentumBandSkeleton() {
  return (
    <section aria-hidden>
      <div className="mb-3 h-6 w-36 rounded-lg bg-charcoal/10" />
      <div className="h-44 rounded-gs-lg border border-line bg-surface-raised motion-safe:animate-pulse" />
    </section>
  );
}
