// Enter-Workspace cards (Dashboard §2 · Home hub) — two premium DecisionCards, each carrying its
// workspace snapshot from REAL data (Amendments §F: the snapshot merges INTO the card). Async
// server component → streamed below the first viewport. Honest: 0% / 0 invites render truthfully.
import { GraduationCap, Users } from "lucide-react";
import { getEnrolledCourses } from "../../lib/lms/queries";
import { getReferralTree } from "../../lib/affiliate/referrals";
import { isFeatureVisible } from "../../lib/feature-visibility";
import { formatCount } from "../../lib/format";
import { DecisionCard } from "../cards/decision/decision-card";
import { BentoGrid, BentoItem } from "../cards/decision/bento";
import { ProgressRing } from "../data/progress-ring";
import { NetworkNodes } from "../data/network-nodes";

export async function EnterWorkspaces({ userId }: { userId: string }) {
  const affiliateVisible = isFeatureVisible("earn");
  const [enrolled, tree] = await Promise.all([
    getEnrolledCourses(userId),
    affiliateVisible ? getReferralTree(userId) : Promise.resolve(null),
  ]);

  const maxPercent = enrolled.reduce(
    (m, c) => Math.max(m, c.progress.percent),
    0,
  );
  const l1 = tree?.l1Count ?? 0;

  return (
    <section aria-label="Enter a workspace">
      <h2 className="mb-3 font-heading text-h4 font-bold text-ink">
        Jump back in
      </h2>
      <BentoGrid className="xl:grid-cols-2">
        <BentoItem size="primary">
          <DecisionCard
            icon={GraduationCap}
            label="Learning"
            accent="green"
            size="primary"
            cta="Enter Learning"
            href="/dashboard/learn"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="dc-number text-h1 font-bold text-ink">
                  {maxPercent}
                  <span className="dc-unit">%</span>
                </p>
                <p className="mt-1 text-caption text-ink-muted">
                  furthest course progress
                </p>
              </div>
              <ProgressRing value={maxPercent} size={72} spark />
            </div>
          </DecisionCard>
        </BentoItem>

        {affiliateVisible && (
          <BentoItem size="primary">
            <DecisionCard
              icon={Users}
              label="Affiliate"
              accent="gold"
              size="primary"
              cta="Enter Affiliate"
              href="/dashboard/earn"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="dc-number text-h1 font-bold text-ink">
                    {formatCount(l1)}
                  </p>
                  <p className="mt-1 text-caption text-ink-muted">
                    {l1 === 1 ? "friend invited" : "friends invited"}
                  </p>
                </div>
                <div className="w-36 shrink-0">
                  <NetworkNodes count={l1} height={76} />
                </div>
              </div>
            </DecisionCard>
          </BentoItem>
        )}
      </BentoGrid>
    </section>
  );
}

/** Skeleton for the Suspense fallback — matches the two-card layout (zero CLS). */
export function EnterWorkspacesSkeleton() {
  return (
    <section aria-hidden>
      <div className="mb-3 h-6 w-32 rounded-lg bg-charcoal/10" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-36 rounded-gs-lg border border-line bg-surface-raised motion-safe:animate-pulse" />
        <div className="h-36 rounded-gs-lg border border-line bg-surface-raised motion-safe:animate-pulse" />
      </div>
    </section>
  );
}
