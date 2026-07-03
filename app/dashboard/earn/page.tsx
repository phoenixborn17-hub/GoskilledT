// Earn tab — D-01 compliant PLACEHOLDER only. No earnings, no commissions, no wallet,
// no income claims (D-29). The affiliate programme is gated behind legal review (D-01).
import { Card, CardTitle, CardDescription } from "../../../components/ui/card";

export default function EarnPage() {
  return (
    <section aria-labelledby="earn-heading" className="space-y-6">
      <h1 id="earn-heading" className="font-heading text-2xl font-bold">Earn</h1>
      <Card className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-charcoal" aria-hidden>
          <span className="font-heading text-lg font-bold">₹</span>
        </div>
        <CardTitle>Coming after review</CardTitle>
        <CardDescription>
          The referral programme is being finalised and will open once approved. Focus on learning for now —
          we&apos;ll notify you here when it&apos;s ready.
        </CardDescription>
      </Card>
    </section>
  );
}
