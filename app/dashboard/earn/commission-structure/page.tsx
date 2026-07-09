// Commission-structure page (Phase B / B5). Shows the fixed DR-007 3-level reward structure for both
// packages. Compliance-safe (learning-first, no income guarantees — D-29). Gated behind the payouts
// flag (D-01): until the programme is legally live we don't publish reward amounts — the same pending
// state the other money surfaces use.
import { payoutsEnabled } from "../../../../lib/env";
import { formatINR } from "../../../../lib/money";
import {
  commissionStructure,
  COMMISSION_STRUCTURE_COPY,
} from "../../../../lib/affiliate/commission-structure";
import { AFFILIATE_COPY } from "../../../../lib/affiliate/copy";
import { levelLabel } from "../../../../lib/affiliate/labels";
import {
  Card,
  CardTitle,
  CardDescription,
} from "../../../../components/ui/card";

export const dynamic = "force-dynamic";

export default function CommissionStructurePage() {
  const rows = commissionStructure();

  return (
    <section aria-labelledby="cs-heading" className="space-y-6">
      <h1 id="cs-heading" className="font-heading text-2xl font-bold">
        {COMMISSION_STRUCTURE_COPY.heading}
      </h1>

      {!payoutsEnabled() ? (
        <Card className="bg-gold/10">
          <CardTitle>{AFFILIATE_COPY.moneyPendingHeading}</CardTitle>
          <CardDescription>{AFFILIATE_COPY.moneyPendingBody}</CardDescription>
        </Card>
      ) : (
        <>
          <p className="max-w-prose text-sm text-muted">
            {COMMISSION_STRUCTURE_COPY.intro}
          </p>

          <div className="space-y-4">
            {rows.map((row) => (
              <Card key={row.slug} className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <CardTitle className="text-base">{row.name}</CardTitle>
                  <span className="text-sm text-muted">
                    up to {formatINR(row.totalInPaise)} / purchase
                  </span>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  {row.levels.map((l) => (
                    <div key={l.level} className="rounded-xl bg-gold/10 p-3">
                      <dt className="text-xs font-medium text-charcoal/60">
                        {levelLabel(l.level)}
                      </dt>
                      <dd className="font-heading text-lg font-bold text-charcoal">
                        {formatINR(l.amountInPaise)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>

          <p className="max-w-prose text-xs text-muted">
            {COMMISSION_STRUCTURE_COPY.disclaimer}
          </p>
        </>
      )}
    </section>
  );
}
