// /admin/rewards — reward definitions (admin-configurable) + a read-only leaderboard for visibility
// (Phase E/D). Rank is by completed-referrals (DR-034/DR-035), never earnings. No money, no PII.
import { listRewardDefinitions } from "../../../lib/admin/rewards";
import { getLeaderboard } from "../../../lib/affiliate/leaderboard";
import { PageHeading } from "../../../components/admin/primitives";
import {
  CreateRewardForm,
  ToggleRewardActive,
} from "../../../components/admin/reward-manager";
import { Card, CardTitle } from "../../../components/ui/card";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null): string {
  return d
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(d)
    : "—";
}

export default async function AdminRewardsPage() {
  const [rewards, board] = await Promise.all([
    listRewardDefinitions(),
    getLeaderboard(10),
  ]);

  return (
    <section className="space-y-5">
      <PageHeading
        title="Rewards & tiers"
        subtitle="Configure reward targets. Ranking is by learners-who-completed a course (DR-035), never earnings."
      />

      <Card className="space-y-3">
        <CardTitle className="text-base">New reward</CardTitle>
        <CreateRewardForm />
      </Card>

      <Card className="space-y-3">
        <CardTitle className="text-base">
          Reward definitions · {rewards.length}
        </CardTitle>
        {rewards.length === 0 ? (
          <p className="text-sm text-muted">No rewards defined yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3 font-medium">Title</th>
                  <th className="py-2 pr-3 font-medium">Target</th>
                  <th className="py-2 pr-3 font-medium">Last date</th>
                  <th className="py-2 pr-3 font-medium">Active</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {rewards.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3 font-medium text-ink">
                      {r.title}
                    </td>
                    <td className="py-2 pr-3 text-muted">
                      {r.target} {r.metric.replace(/_/g, " ")}
                    </td>
                    <td className="py-2 pr-3 text-muted">
                      {fmtDate(r.lastDate)}
                    </td>
                    <td className="py-2 pr-3 text-muted">
                      {r.isActive ? "Yes" : "No"}
                    </td>
                    <td className="py-2">
                      <ToggleRewardActive id={r.id} isActive={r.isActive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <CardTitle className="text-base">Leaderboard (top 10)</CardTitle>
        {board.length === 0 ? (
          <p className="text-sm text-muted">
            No completed referrals yet — nothing to rank.
          </p>
        ) : (
          <ol className="divide-y divide-line/60 text-sm">
            {board.map((e) => (
              <li
                key={e.userId}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span>
                  #{e.rank} · {e.displayName || "GoSkilled member"}
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
