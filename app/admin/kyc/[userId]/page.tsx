// /admin/kyc/[userId] — KYC review detail (GPS-M4 §2.2). Masked PAN/account + account-holder name +
// IFSC by default; explicit reveal (logged); decision + reason; per-user decision history. Decrypt
// failures render a safe error, never partial PII.
import { notFound } from "next/navigation";
import Link from "next/link";
import { getKycReviewDetail } from "../../../../lib/admin/kyc";
import { KycReveal } from "../../../../components/admin/kyc-reveal";
import { KycDecision } from "../../../../components/admin/kyc-decision";
import {
  PageHeading,
  fmtDateTime,
} from "../../../../components/admin/primitives";
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
      <Link
        href="/admin/kyc"
        className="text-sm text-muted hover:text-ink"
      >
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
        <Card className="border-danger/20 bg-danger/10">
          <p className="text-sm font-semibold text-danger">
            Could not decrypt these details.
          </p>
          <p className="mt-1 text-sm text-danger/80">
            Do not make a decision. Check that PII_ENCRYPTION_KEY matches the
            key used at submission, then retry.
          </p>
        </Card>
      ) : (
        <Card className="space-y-4">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">Email</dt>
            <dd className="font-semibold">
              {detail.email ?? "—"} <VerifyTag ok={detail.emailVerified} />
            </dd>
            <dt className="text-muted">WhatsApp</dt>
            <dd className="font-semibold">
              {detail.whatsapp ?? "—"}{" "}
              <VerifyTag ok={detail.whatsappVerified} />
            </dd>
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
            <dt className="text-muted">Bank name</dt>
            <dd className="font-semibold">{detail.bankName ?? "—"}</dd>
            <dt className="text-muted">IFSC</dt>
            <dd className="font-mono font-semibold">{detail.ifsc ?? "—"}</dd>
            <dt className="text-muted">Address doc</dt>
            <dd>{detail.docType ?? "—"}</dd>
            <dt className="text-muted">Submitted</dt>
            <dd>{fmtDateTime(detail.submittedAt)}</dd>
          </dl>

          {/* Documents — each open is reveal-logged (KYC_DOC_VIEWED) by the admin route. */}
          <div className="border-t border-line pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Documents
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              {(["pan", "address", "bank"] as const).map((kind) =>
                detail.docs[kind] ? (
                  <a
                    key={kind}
                    href={`/admin/kyc/${detail.userId}/doc/${kind}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:bg-charcoal/5"
                  >
                    View {kind} doc
                  </a>
                ) : (
                  <span
                    key={kind}
                    className="rounded-lg bg-charcoal/5 px-3 py-1.5 text-muted"
                  >
                    No {kind} doc
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="border-t border-line pt-4">
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
          <ul className="divide-y divide-line/60 text-sm">
            {detail.history.map((h, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="font-medium text-ink">{h.action}</span>
                {h.reason && <span className="text-muted">“{h.reason}”</span>}
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

function VerifyTag({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-xs font-semibold text-brand">✓ verified</span>
  ) : (
    <span className="text-xs text-muted">unverified</span>
  );
}
