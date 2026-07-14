// Commission-structure page (Phase B / B5; Vibrant rollout Slice C). Shows the fixed DR-007
// 3-level reward structure for both packages. Compliance-safe (learning-first, no income
// guarantees — D-29). Gated behind the payouts flag (D-01): until the programme is legally live we
// don't publish reward amounts — the same pending state the other money surfaces use.
import { payoutsEnabled } from "../../../../lib/env";
import { formatINR } from "../../../../lib/money";
import {
  commissionStructure,
  COMMISSION_STRUCTURE_COPY,
} from "../../../../lib/affiliate/commission-structure";
import { AFFILIATE_COPY } from "../../../../lib/affiliate/copy";
import { levelLabel } from "../../../../lib/affiliate/labels";

export const dynamic = "force-dynamic";

export default function CommissionStructurePage() {
  const rows = commissionStructure();

  return (
    <section aria-labelledby="cs-heading" className="gs-vibrant space-y-6">
      <h1 id="cs-heading" className="font-heading text-h1 font-bold text-ink">
        {COMMISSION_STRUCTURE_COPY.heading}
      </h1>

      {!payoutsEnabled() ? (
        <div className="vh-card vh-soft vh-accent-earn dc-enter p-6">
          <h2 className="font-heading text-h4 font-bold text-ink">
            {AFFILIATE_COPY.moneyPendingHeading}
          </h2>
          <p className="mt-1 text-body text-ink-muted">
            {AFFILIATE_COPY.moneyPendingBody}
          </p>
        </div>
      ) : (
        <>
          <p className="max-w-prose text-small text-ink-muted">
            {COMMISSION_STRUCTURE_COPY.intro}
          </p>

          <div className="space-y-4">
            {rows.map((row, i) => (
              <div
                key={row.slug}
                className="vh-card vh-soft vh-accent-earn dc-enter space-y-3 p-6"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-heading text-h4 font-bold text-ink">
                    {row.name}
                  </h3>
                  <span className="text-small text-ink-muted">
                    up to {formatINR(row.totalInPaise)} / purchase
                  </span>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  {row.levels.map((l) => (
                    <div key={l.level} className="vh-plate-grad rounded-xl p-3">
                      <dt className="text-caption font-medium text-ink-muted">
                        {levelLabel(l.level)}
                      </dt>
                      <dd className="dc-number vh-text font-heading text-h4 font-bold">
                        {formatINR(l.amountInPaise)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <p className="max-w-prose text-caption text-ink-muted">
            {COMMISSION_STRUCTURE_COPY.disclaimer}
          </p>
        </>
      )}
    </section>
  );
}
