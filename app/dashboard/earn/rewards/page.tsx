// Rewards (Phase D · D2; Vibrant rollout Slice C — purple achievement accent). Shows the
// affiliate's contribution tier + their progress toward each ACTIVE admin-defined reward, derived
// from completed-referrals (DR-035). No earnings framing, no fabricated numbers (D-29).
import { getCurrentUser } from "../../../../lib/auth/session";
import { getRewardProgress } from "../../../../lib/affiliate/rewards";
import { completedReferralCount } from "../../../../lib/affiliate/completion";
import { tierProgress } from "../../../../modules/affiliate/tiers";

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
    <section aria-labelledby="rw-heading" className="gs-vibrant space-y-6">
      <h1 id="rw-heading" className="font-heading text-h1 font-bold text-ink">
        Rewards
      </h1>

      <div className="vh-card vh-bold vh-accent-achieve dc-enter p-6">
        <p className="text-caption font-semibold uppercase tracking-wide text-white/80">
          Your tier
        </p>
        <p className="dc-number font-heading text-h2 font-extrabold text-white">
          {mine.tier}
        </p>
        <p className="mt-1 text-small text-white/85">
          {mine.completedReferrals} referred learner
          {mine.completedReferrals === 1 ? "" : "s"} completed a course.
          {mine.nextTier && mine.toNext! > 0 && (
            <>
              {" "}
              {mine.toNext} more to become a {mine.nextTier}.
            </>
          )}
        </p>
      </div>

      {rewards.length === 0 ? (
        <div className="vh-card vh-soft vh-accent-achieve dc-enter p-6">
          <p className="text-small text-ink-muted">
            No rewards are running right now. When a reward opens, you&apos;ll
            see your progress here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rewards.map((r, i) => (
            <div
              key={r.id}
              className="vh-card vh-soft vh-accent-achieve dc-enter space-y-2 p-6"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-heading text-h4 font-bold text-ink">
                  {r.title}
                </h3>
                {r.achieved && (
                  <span className="vh-text text-caption font-semibold">
                    Achieved ✓
                  </span>
                )}
              </div>
              {r.description && (
                <p className="text-small text-ink-muted">{r.description}</p>
              )}
              <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${r.percent}%`,
                    background:
                      "linear-gradient(90deg, var(--vh), var(--vh-2))",
                  }}
                  aria-hidden
                />
              </div>
              <p className="text-caption text-ink-muted">
                {r.current} / {r.target} completed referrals
                {r.lastDate && <> · by {fmtDate(r.lastDate)}</>}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
