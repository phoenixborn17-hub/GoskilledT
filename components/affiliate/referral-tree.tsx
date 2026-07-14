// Referral tree (GPS-M3 §2.1; Vibrant rollout Slice C — indigo network accent). Accessible list,
// not a visual-only graphic. Privacy: L1 shows names, L2/L3 are aggregate counts only (unchanged).
// Truthful — real data, zero inflation. Counts are non-money — CountUp is honesty-safe here.
import type { ReferralTree as Tree } from "../../lib/affiliate/referrals";
import { CountUp } from "../data/animated";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export function ReferralTree({ tree }: { tree: Tree }) {
  if (tree.totalInvites === 0) {
    return (
      <p className="rounded-xl bg-surface-raised p-4 text-small text-ink-muted">
        No invites yet — share your link to get started.
      </p>
    );
  }

  return (
    <div className="vh-card vh-soft vh-accent-network dc-enter space-y-5 p-6">
      {/* Level counts as a small summary list */}
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Level 1", tree.l1Count],
          ["Level 2", tree.l2Count],
          ["Level 3", tree.l3Count],
        ].map(([label, count]) => (
          <div key={label} className="vh-plate-grad rounded-xl p-3">
            <dt className="text-caption font-medium text-ink-muted">{label}</dt>
            <dd className="dc-number vh-text font-heading text-h3 font-bold">
              <CountUp value={count as number} />
            </dd>
          </div>
        ))}
      </dl>

      {/* L1 — names shown (direct invites) */}
      {tree.l1.length > 0 && (
        <div>
          <h3 className="mb-2 font-heading text-small font-bold text-ink">
            Your direct invites (Level 1)
          </h3>
          <ul className="divide-y divide-line/60 rounded-xl border border-line">
            {tree.l1.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 px-4 py-3 text-small"
              >
                <span className="font-medium text-ink">
                  {p.name || "GoSkilled learner"}
                </span>
                <span className="text-ink-muted">
                  joined {formatDate(p.joinedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(tree.l2Count > 0 || tree.l3Count > 0) && (
        <p className="text-caption text-ink-muted">
          Level 2 and 3 show counts only, to protect the privacy of people you
          didn&apos;t invite directly.
        </p>
      )}
    </div>
  );
}
