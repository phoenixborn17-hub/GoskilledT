// Leaderboard (Phase D · D1). MINIMAL consumer surface (premium redesign is a separate track — do
// not invest here). Ranks affiliates by completed-referrals (DR-034), never earnings/team-size.
// Shows first names + counts only (privacy). Honest empty state (D-29).
import { getCurrentUser } from "../../../../lib/auth/session";
import { getLeaderboard } from "../../../../lib/affiliate/leaderboard";
import { completedReferralCount } from "../../../../lib/affiliate/completion";
import { tierProgress } from "../../../../modules/affiliate/tiers";
import { Card, CardTitle } from "../../../../components/ui/card";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  const [board, myCompleted] = await Promise.all([
    getLeaderboard(20),
    completedReferralCount(user!.id),
  ]);
  const mine = tierProgress(myCompleted);

  return (
    <section aria-labelledby="lb-heading" className="space-y-6">
      <h1 id="lb-heading" className="font-heading text-h1 font-bold text-ink">
        Leaderboard
      </h1>

      <Card className="bg-gold/10">
        <p className="text-sm text-muted">
          Ranked by <strong>learners you referred who finished a course</strong>{" "}
          — not earnings. Keep helping people learn.
        </p>
        <p className="mt-2 text-sm">
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
      </Card>

      <Card className="space-y-3">
        <CardTitle className="text-base">Top contributors</CardTitle>
        {board.length === 0 ? (
          <p className="rounded-xl bg-charcoal/5 p-4 text-sm text-muted">
            No completed referrals yet — be the first to help someone finish a
            course.
          </p>
        ) : (
          <ol className="divide-y divide-charcoal/5">
            {board.map((e) => (
              <li
                key={e.userId}
                className={
                  "flex items-center justify-between gap-3 py-2 text-sm " +
                  (e.userId === user!.id ? "font-semibold text-brand" : "")
                }
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-charcoal">
                    {e.rank}
                  </span>
                  {e.displayName || "GoSkilled member"}
                  {e.userId === user!.id && " (you)"}
                </span>
                <span className="text-muted">
                  {e.completedReferrals} completed
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
  );
}
