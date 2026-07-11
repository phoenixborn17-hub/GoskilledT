// /admin/withdrawals — Tuesday payout run (GPS-M4 §2.3). Verify (KYC approved · amount ≤ available,
// server-recomputed at marking) → pay via bank → Mark PAID (domain PAYOUT tx) / Reject. History tab.
import {
  listWithdrawalQueue,
  listWithdrawalHistory,
  type WithdrawalRow,
} from "../../../lib/admin/withdrawals";
import { formatINR } from "../../../lib/money";
import { payoutsEnabled } from "../../../lib/env";
import { WithdrawalActions } from "../../../components/admin/withdrawal-actions";
import { PageHeading, fmtDateTime } from "../../../components/admin/primitives";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

export const dynamic = "force-dynamic";

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={ok ? "text-brand-deep" : "text-red-600"} title={label}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

function KycBadge({ status }: { status: WithdrawalRow["kycStatus"] }) {
  const variant = status === "APPROVED" ? "brand" : "muted";
  return <Badge variant={variant}>KYC {status ?? "NONE"}</Badge>;
}

export default async function WithdrawalsPage() {
  const [queue, history] = await Promise.all([
    listWithdrawalQueue(),
    listWithdrawalHistory(),
  ]);
  const payouts = payoutsEnabled();

  return (
    <section className="space-y-6">
      <PageHeading
        title="Withdrawals"
        subtitle={`${queue.length} awaiting payout · manual bank rail (Tuesday cadence).`}
      />

      {!payouts && (
        <Card className="border-warning-strong/30 bg-warning-soft/40 text-sm text-warning-strong">
          <strong>Payouts disabled (D-01).</strong> Affiliate payouts are OFF
          until legal clearance. Do <strong>not</strong> transfer money — Mark
          PAID is disabled and the server will reject any payout attempt.
        </Card>
      )}

      <div className="space-y-3">
        {queue.length === 0 ? (
          <Card className="text-center text-muted">
            No withdrawals awaiting payout.
          </Card>
        ) : (
          queue.map((w) => {
            const amountOk =
              w.availableInPaise != null &&
              w.amountInPaise <= w.availableInPaise;
            const kycOk = w.kycStatus === "APPROVED";
            return (
              <Card
                key={w.id}
                className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-lg font-bold text-charcoal">
                      {formatINR(w.amountInPaise)}
                    </span>
                    <KycBadge status={w.kycStatus} />
                  </div>
                  <p className="text-sm text-muted">
                    {w.phone ?? "—"} · {w.holderName ?? "—"} ·{" "}
                    {w.accountLast4 ?? "no account"}
                  </p>
                  <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <Check ok={kycOk} label="KYC approved" />
                    <Check
                      ok={amountOk}
                      label={`Amount ≤ available (${
                        w.availableInPaise != null
                          ? formatINR(w.availableInPaise)
                          : "—"
                      })`}
                    />
                  </p>
                  <p className="text-xs text-muted">
                    Requested {fmtDateTime(w.requestedAt)}
                  </p>
                </div>
                <div className="md:w-64 md:shrink-0">
                  <WithdrawalActions
                    withdrawalId={w.id}
                    canMark={kycOk && amountOk && payouts}
                    payoutsEnabled={payouts}
                    status={w.status}
                  />
                </div>
              </Card>
            );
          })
        )}
      </div>

      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-muted">
            History
          </h2>
          {history.map((w) => (
            <Card
              key={w.id}
              className="flex items-center justify-between gap-3 opacity-80"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {formatINR(w.amountInPaise)} · {w.phone ?? "—"}
                </p>
                <p className="text-xs text-muted">
                  {w.status === "PAID"
                    ? `Paid ${fmtDateTime(w.paidAt)}`
                    : `Rejected — ${w.adminNote ?? "no reason"}`}
                </p>
              </div>
              <Badge variant={w.status === "PAID" ? "brand" : "outline"}>
                {w.status}
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
