// KYC (GPS-M3 §2.4, Tier A · PII). Verify identity before money leaves. FLAG OFF → pending state.
// FLAG ON → status-aware: NOT SUBMITTED (form) / UNDER REVIEW / VERIFIED / REJECTED (resubmit).
// PII is encrypted at rest and only ever shown masked (last-4).
import { ShieldCheck, Clock, ShieldX } from "lucide-react";
import { getCurrentUser } from "../../../../lib/auth/session";
import { payoutsEnabled } from "../../../../lib/env";
import { getKycView } from "../../../../lib/kyc/queries";
import { AFFILIATE_COPY } from "../../../../lib/affiliate/copy";
import { KycForm } from "../../../../components/affiliate/kyc-form";
import {
  Card,
  CardTitle,
  CardDescription,
} from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";

export const dynamic = "force-dynamic";

export default async function KycPage() {
  const user = await getCurrentUser();

  return (
    <section aria-labelledby="kyc-heading" className="space-y-6">
      <h1 id="kyc-heading" className="font-heading text-2xl font-bold">
        KYC verification
      </h1>
      {payoutsEnabled() ? (
        <KycBody userId={user!.id} />
      ) : (
        <Card className="bg-gold/10">
          <CardTitle>{AFFILIATE_COPY.moneyPendingHeading}</CardTitle>
          <CardDescription>
            KYC verification opens with the programme. Nothing to do yet —
            we&apos;ll ask for your details when withdrawals go live.
          </CardDescription>
        </Card>
      )}
    </section>
  );
}

async function KycBody({ userId }: { userId: string }) {
  const kyc = await getKycView(userId);

  if (kyc.uiStatus === "VERIFIED") {
    return (
      <>
        <Card className="flex items-start gap-3 bg-brand/5">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-brand"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-charcoal">Verified</p>
            <p className="text-sm text-muted">
              {kyc.holderName} · PAN {kyc.panMasked} · A/C {kyc.accountMasked} ·
              IFSC {kyc.ifsc}
            </p>
          </div>
        </Card>
        <StoreNote />
      </>
    );
  }

  if (kyc.uiStatus === "UNDER_REVIEW") {
    return (
      <>
        <Card className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-charcoal">Under review</p>
            <p className="text-sm text-muted">
              We&apos;re verifying your details ({kyc.holderName} · A/C{" "}
              {kyc.accountMasked}). We&apos;ll update you here.
            </p>
          </div>
        </Card>
        <StoreNote />
      </>
    );
  }

  // NOT_SUBMITTED or REJECTED → show the form (REJECTED gets a reason banner + resubmit).
  return (
    <>
      {kyc.uiStatus === "REJECTED" && (
        <Card className="flex items-start gap-3 border-red-200 bg-red-50">
          <ShieldX
            className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-charcoal">
              Verification was rejected
            </p>
            <p className="text-sm text-muted">
              Please check your details and submit again.
            </p>
          </div>
        </Card>
      )}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="text-base">Your KYC details</CardTitle>
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
      </Card>
      <StoreNote />
    </>
  );
}

function StoreNote() {
  return (
    <p className="text-xs text-muted">
      We store your PAN and bank details <strong>encrypted</strong> and use them
      only to verify you and send your withdrawals. They&apos;re never shown in
      full, never shared, and never used for anything else.
    </p>
  );
}
