// KYC (GPS-M3 §2.4, Tier A · PII; Vibrant rollout Slice C — cyan status accent, Command Center
// Spec §4.2 4b). Verify identity before money leaves. FLAG OFF → pending state. FLAG ON →
// status-aware: NOT SUBMITTED (form) / UNDER REVIEW / VERIFIED / REJECTED (resubmit). PII is
// encrypted at rest and only ever shown masked (last-4) — display re-skin only, no PII/encryption
// logic touched.
import { ShieldCheck, Clock, ShieldX } from "lucide-react";
import { getCurrentUser } from "../../../../lib/auth/session";
import { payoutsEnabled } from "../../../../lib/env";
import { getKycView } from "../../../../lib/kyc/queries";
import { AFFILIATE_COPY } from "../../../../lib/affiliate/copy";
import { KycForm } from "../../../../components/affiliate/kyc-form";
import { Badge } from "../../../../components/ui/badge";
import { BackLink } from "../../../../components/nav/back-link";

export const dynamic = "force-dynamic";

export default async function KycPage() {
  const user = await getCurrentUser();

  return (
    <section aria-labelledby="kyc-heading" className="gs-vibrant space-y-6">
      <BackLink href="/dashboard/profile" label="Back to Account" />
      <h1 id="kyc-heading" className="font-heading text-h1 font-bold text-ink">
        KYC verification
      </h1>
      {payoutsEnabled() ? (
        <KycBody userId={user!.id} />
      ) : (
        <div className="vh-card vh-soft vh-accent-cyan dc-enter p-6">
          <h2 className="font-heading text-h4 font-bold text-ink">
            {AFFILIATE_COPY.moneyPendingHeading}
          </h2>
          <p className="mt-1 text-body text-ink-muted">
            KYC verification opens with the programme. Nothing to do yet —
            we&apos;ll ask for your details when withdrawals go live.
          </p>
        </div>
      )}
    </section>
  );
}

async function KycBody({ userId }: { userId: string }) {
  const kyc = await getKycView(userId);

  if (kyc.uiStatus === "VERIFIED") {
    return (
      <>
        <div className="flex items-start gap-3 rounded-gs-lg border border-line bg-success/5 p-6">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-success"
            aria-hidden
          />
          <div>
            <p className="text-small font-semibold text-ink">Verified</p>
            <p className="text-small text-ink-muted">
              {kyc.holderName} · PAN {kyc.panMasked} · A/C {kyc.accountMasked} ·
              IFSC {kyc.ifsc}
            </p>
          </div>
        </div>
        <StoreNote />
      </>
    );
  }

  if (kyc.uiStatus === "UNDER_REVIEW") {
    return (
      <>
        <div className="vh-card vh-soft vh-accent-cyan dc-enter flex items-start gap-3 p-6">
          <Clock className="vh-text mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="text-small font-semibold text-ink">Under review</p>
            <p className="text-small text-ink-muted">
              We&apos;re verifying your details ({kyc.holderName} · A/C{" "}
              {kyc.accountMasked}). We&apos;ll update you here.
            </p>
          </div>
        </div>
        <StoreNote />
      </>
    );
  }

  // NOT_SUBMITTED or REJECTED → show the form (REJECTED gets a reason banner + resubmit).
  return (
    <>
      {kyc.uiStatus === "REJECTED" && (
        <div className="flex items-start gap-3 rounded-gs-lg border border-danger/30 bg-danger/10 p-6">
          <ShieldX
            className="mt-0.5 h-5 w-5 shrink-0 text-danger"
            aria-hidden
          />
          <div>
            <p className="text-small font-semibold text-ink">
              Verification was rejected
            </p>
            <p className="text-small text-ink-muted">
              Please check your details and submit again.
            </p>
          </div>
        </div>
      )}
      <div className="vh-card vh-soft vh-accent-cyan dc-enter p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-h4 font-bold text-ink">
            Your KYC details
          </h2>
          <Badge variant="muted">Encrypted</Badge>
        </div>
        <KycForm
          initial={{
            email: kyc.email,
            emailVerified: kyc.emailVerified,
            whatsapp: kyc.whatsapp,
            whatsappVerified: kyc.whatsappVerified,
          }}
        />
      </div>
      <StoreNote />
    </>
  );
}

function StoreNote() {
  return (
    <p className="text-caption text-ink-muted">
      We store your PAN and bank details <strong>encrypted</strong> and use them
      only to verify you and send your withdrawals. They&apos;re never shown in
      full, never shared, and never used for anything else.
    </p>
  );
}
