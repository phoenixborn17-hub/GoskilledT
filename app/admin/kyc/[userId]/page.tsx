// /admin/kyc/[userId] — KYC review detail (GPS-M4 §2.2). Masked PAN/account + account-holder name +
// IFSC by default; explicit reveal (logged); decision + reason; per-user decision history. Decrypt
// failures render a safe error, never partial PII.
import { notFound } from "next/navigation";
import Link from "next/link";
import { getKycReviewDetail } from "../../../../lib/admin/kyc";
import { KycReveal } from "../../../../components/admin/kyc-reveal";
import { KycDecision } from "../../../../components/admin/kyc-decision";
import { PageHeading, fmtDateTime } from "../../../../components/admin/primitives";
import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "brand" | "muted" | "gold" | "outline"> = {
  APPROVED: "brand",
  SUBMITTED: "gold",
  REJECTED: "outline",
  DRAFT: "muted",
};

export default async function KycDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const detail = await getKycReviewDetail(userId);
  if (!detail) notFound();

  return (
    <section className="space-y-5">
      <Link href="/admin/kyc" className="text-sm text-muted hover:text-charcoal">
        ← Back to queue
      </Link>
      <PageHeading
        title="KYC review"
        subtitle={detail.phone ?? undefined}
        action={
          <Badge variant={STATUS_VARIANT[detail.status] ?? "muted"}>
            {detail.status}
          </Badge>
        }
      />

      {detail.decryptError ? (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm font-semibold text-red-700">
            Could not decrypt these details.
          </p>
          <p className="mt-1 text-sm text-red-700/80">
            Do not make a decision. Check that PII_ENCRYPTION_KEY matches the
            key used at submission, then retry.
          </p>
        </Card>
      ) : (
        <Card className="space-y-4">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">PAN</dt>
            <dd className="font-mono font-semibold">
              {detail.panMasked ?? "—"}
            </dd>
            <dt className="text-muted">Account no.</dt>
            <dd className="font-mono font-semibold">
              {detail.accountMasked ?? "—"}
            </dd>
            <dt className="text-muted">Account holder name</dt>
            <dd className="font-semibold">{detail.holderName ?? "—"}</dd>
            <dt className="text-muted">IFSC</dt>
            <dd className="font-mono font-semibold">{detail.ifsc ?? "—"}</dd>
            <dt className="text-muted">Submitted</dt>
            <dd>{fmtDateTime(detail.submittedAt)}</dd>
          </dl>
          <div className="border-t border-charcoal/10 pt-4">
            <KycReveal userId={detail.userId} />
          </div>
        </Card>
      )}

      {detail.status === "SUBMITTED" && !detail.decryptError && (
        <Card>
          <h2 className="mb-3 font-heading text-lg font-bold">Decision</h2>
          <KycDecision userId={detail.userId} />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold">History</h2>
        {detail.history.length === 0 ? (
          <p className="text-sm text-muted">No prior activity.</p>
        ) : (
          <ul className="divide-y divide-charcoal/5 text-sm">
            {detail.history.map((h, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="font-medium text-charcoal">{h.action}</span>
                {h.reason && (
                  <span className="text-muted">“{h.reason}”</span>
                )}
                <span className="text-xs text-muted">
                  {h.actorEmail ?? "—"} · {fmtDateTime(h.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
