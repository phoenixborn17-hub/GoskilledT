// Momentum band (Command_Center_Spec §2.5) — the Home visual-analytics band, streamed below the
// first viewport. Learning momentum for EVERYONE; the earn trend ONLY for eligible affiliates
// (the loader returns null otherwise — the learning panel then takes the full width; recomposition,
// never a locked teaser). Money in the earn panel is a real recorded-commission series (DR-043
// framing); figures stay charcoal, gold is the frame.
import { TrendingUp, Coins } from "lucide-react";
import { getHomeMomentum } from "../../lib/home/momentum";
import { formatINRFromPaise } from "../../lib/format";
import { AreaChart } from "../data/area-chart";
import { ChartPanel } from "../cards/decision/chart-panel";

export async function MomentumBand({ userId }: { userId: string }) {
  const m = await getHomeMomentum(userId);
  const twoUp = m.earn !== null;

  return (
    <section aria-label="Your momentum">
      <h2 className="mb-3 font-heading text-h4 font-bold text-ink">
        Your momentum
      </h2>
      <div className={twoUp ? "grid gap-4 lg:grid-cols-2" : "grid gap-4"}>
        <ChartPanel
          icon={TrendingUp}
          title="Learning activity"
          accent="green"
          meta="Last 14 days"
          ready={m.learningTotal > 0}
          chart={
            <AreaChart
              points={m.learning}
              height={96}
              label="Lessons completed per day, last 14 days"
            />
          }
          summary={`${m.learningTotal} ${
            m.learningTotal === 1 ? "lesson" : "lessons"
          } completed over the last 14 days`}
          unlockLine="Your momentum graph starts with your first lesson."
          unlockCta={{ label: "Start learning", href: "/dashboard/learn" }}
        />

        {m.earn && (
          <ChartPanel
            icon={Coins}
            title="Recorded earnings"
            accent="gold"
            meta="Last 14 days · recorded to your wallet"
            ready={m.earn.totalInPaise > 0}
            chart={
              <AreaChart
                points={m.earn.series}
                height={96}
                label="Commission recorded per day, last 14 days"
              />
            }
            summary={`${formatINRFromPaise(m.earn.totalInPaise)} recorded over the last 14 days`}
            unlockLine="Your earnings trend appears with your first recorded commission."
            unlockCta={{ label: "Open Earn", href: "/dashboard/earn" }}
          />
        )}
      </div>
    </section>
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
