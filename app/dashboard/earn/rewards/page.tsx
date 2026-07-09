// Rewards (Phase D · D2). MINIMAL consumer surface. Shows the affiliate's contribution tier + their
// progress toward each ACTIVE admin-defined reward, derived from completed-referrals (DR-035). No
// earnings framing, no fabricated numbers (D-29). Premium styling deferred to the redesign track.
import { getCurrentUser } from "../../../../lib/auth/session";
import { getRewardProgress } from "../../../../lib/affiliate/rewards";
import { completedReferralCount } from "../../../../lib/affiliate/completion";
import { tierProgress } from "../../../../modules/affiliate/tiers";
import { Card, CardTitle } from "../../../../components/ui/card";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export default async function RewardsPage() {
  const user = await getCurrentUser();
  const [rewards, completed] = await Promise.all([
    getRewardProgress(user!.id),
    completedReferralCount(user!.id),
  ]);
  const mine = tierProgress(completed);

  return (
    <section aria-labelledby="rw-heading" className="space-y-6">
      <h1 id="rw-heading" className="font-heading text-2xl font-bold">
        Rewards
      </h1>

      <Card className="bg-gold/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          Your tier
        </p>
        <p className="font-heading text-2xl font-extrabold text-charcoal">
          {mine.tier}
        </p>
        <p className="mt-1 text-sm text-muted">
          {mine.completedReferrals} referred learner
          {mine.completedReferrals === 1 ? "" : "s"} completed a course.
          {mine.nextTier && mine.toNext! > 0 && (
            <>
              {" "}
              {mine.toNext} more to become a {mine.nextTier}.
            </>
          )}
        </p>
      </Card>

      {rewards.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            No rewards are running right now. When a reward opens, you&apos;ll
            see your progress here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {rewards.map((r) => (
            <Card key={r.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <CardTitle className="text-base">{r.title}</CardTitle>
                {r.achieved && (
                  <span className="text-xs font-semibold text-brand">
                    Achieved ✓
                  </span>
                )}
              </div>
              {r.description && (
                <p className="text-sm text-muted">{r.description}</p>
              )}
              <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal/10">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${r.percent}%` }}
                  aria-hidden
                />
              </div>
              <p className="text-xs text-muted">
                {r.current} / {r.target} completed referrals
                {r.lastDate && <> · by {fmtDate(r.lastDate)}</>}
              </p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
