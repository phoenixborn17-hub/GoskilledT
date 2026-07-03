// Referral tree (GPS-M3 §2.1). Accessible list, not a visual-only graphic. Privacy: L1 shows
// names, L2/L3 are aggregate counts only. Truthful — real data, zero inflation.
import type { ReferralTree as Tree } from "../../lib/affiliate/referrals";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export function ReferralTree({ tree }: { tree: Tree }) {
  if (tree.totalInvites === 0) {
    return (
      <p className="rounded-xl bg-charcoal/5 p-4 text-sm text-muted">
        No invites yet — share your link to get started.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Level counts as a small summary list */}
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Level 1", tree.l1Count],
          ["Level 2", tree.l2Count],
          ["Level 3", tree.l3Count],
        ].map(([label, count]) => (
          <div key={label} className="rounded-xl bg-gold/10 p-3">
            <dt className="text-xs font-medium text-charcoal/60">{label}</dt>
            <dd className="font-heading text-xl font-bold text-charcoal">
              {count}
            </dd>
          </div>
        ))}
      </dl>

      {/* L1 — names shown (direct invites) */}
      {tree.l1.length > 0 && (
        <div>
          <h3 className="mb-2 font-heading text-sm font-bold">
            Your direct invites (Level 1)
          </h3>
          <ul className="divide-y divide-charcoal/5 rounded-xl border border-charcoal/10">
            {tree.l1.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="font-medium text-charcoal">
                  {p.name || "GoSkilled learner"}
                </span>
                <span className="text-muted">
                  joined {formatDate(p.joinedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(tree.l2Count > 0 || tree.l3Count > 0) && (
        <p className="text-xs text-muted">
          Level 2 and 3 show counts only, to protect the privacy of people you
          didn&apos;t invite directly.
        </p>
      )}
    </div>
  );
}
