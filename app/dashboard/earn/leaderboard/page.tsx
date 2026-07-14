// Leaderboard (Phase D · D1; Vibrant rollout Slice C — purple achievement accent). Ranks affiliates
// by completed-referrals (DR-034), never earnings/team-size. Shows first names + counts only
// (privacy). Honest empty state (D-29).
import { getCurrentUser } from "../../../../lib/auth/session";
import { getLeaderboard } from "../../../../lib/affiliate/leaderboard";
import { completedReferralCount } from "../../../../lib/affiliate/completion";
import { tierProgress } from "../../../../modules/affiliate/tiers";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  const [board, myCompleted] = await Promise.all([
    getLeaderboard(20),
    completedReferralCount(user!.id),
  ]);
  const mine = tierProgress(myCompleted);

  return (
    <section aria-labelledby="lb-heading" className="gs-vibrant space-y-6">
      <h1 id="lb-heading" className="font-heading text-h1 font-bold text-ink">
        Leaderboard
      </h1>

      <div className="vh-card vh-soft vh-accent-achieve dc-enter p-6">
        <p className="text-small text-ink-muted">
          Ranked by <strong>learners you referred who finished a course</strong>{" "}
          — not earnings. Keep helping people learn.
        </p>
        <p className="mt-2 text-small text-ink">
          You&apos;re a <strong>{mine.tier}</strong> with{" "}
          <strong>{mine.completedReferrals}</strong> completed referral
          {mine.completedReferrals === 1 ? "" : "s"}.
          {mine.nextTier && mine.toNext! > 0 && (
            <>
              {" "}
              {mine.toNext} more to reach {mine.nextTier}.
            </>
          )}
        </p>
      </div>

      <div className="vh-card vh-soft vh-accent-achieve dc-enter space-y-3 p-6">
        <h2 className="font-heading text-h4 font-bold text-ink">
          Top contributors
        </h2>
        {board.length === 0 ? (
          <p className="rounded-xl bg-surface-raised p-4 text-small text-ink-muted">
            No completed referrals yet — be the first to help someone finish a
            course.
          </p>
        ) : (
          <ol className="divide-y divide-line/60">
            {board.map((e) => (
              <li
                key={e.userId}
                className={
                  "flex items-center justify-between gap-3 py-2 text-small " +
                  (e.userId === user!.id ? "vh-text font-semibold" : "text-ink")
                }
              >
                <span className="flex items-center gap-3">
                  <span className="vh-plate flex h-6 w-6 items-center justify-center rounded-full text-caption font-bold">
                    {e.rank}
                  </span>
                  {e.displayName || "GoSkilled member"}
                  {e.userId === user!.id && " (you)"}
                </span>
                <span className="text-ink-muted">
                  {e.completedReferrals} completed
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
