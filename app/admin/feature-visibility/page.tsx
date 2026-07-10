// /admin/feature-visibility (DR-040 · Tier A — compliance). View + set feature flags at global /
// role / user scope; every change is written to the immutable AdminAction audit log. This governs
// VISIBILITY of surfaces only — it never touches wallet/commission/withdraw math, and payouts stay
// OFF (D-01) independently. Server enforcement (route guards + the resolver) does the real work;
// this is the operator console for it.
import { listFeatureFlags } from "../../../lib/admin/feature-visibility";
import { FeatureVisibilityControls } from "../../../components/admin/feature-visibility-controls";
import { PageHeading } from "../../../components/admin/primitives";
import { Card } from "../../../components/ui/card";

export const dynamic = "force-dynamic";

export default async function FeatureVisibilityPage() {
  const flags = await listFeatureFlags();

  return (
    <section className="space-y-6">
      <PageHeading
        title="Feature visibility"
        subtitle="Enable / disable a feature per user, per role, or globally. Server-enforced (routes + APIs become unreachable, not just hidden). Audited."
      />

      <Card className="border-l-4 border-l-charcoal bg-charcoal/[0.03]">
        <p className="text-sm text-charcoal">
          <strong>What this is.</strong> The Affiliate layer is a{" "}
          <strong>legal launch-gate / staged rollout</strong> — kept disabled
          until its legal review clears, then enabled. Hiding it recomposes the
          app into a coherent Learning-only product (no dead links, no
          &ldquo;disabled&rdquo; notices). It changes visibility of surfaces
          only — wallet/commission/withdraw math is untouched and payouts stay
          OFF (D-01) independently. Underlying data persists; unhiding restores
          the exact prior state.
        </p>
        <p className="mt-2 text-xs text-muted">
          Precedence is <strong>hide-wins / fail-safe</strong>: if any
          applicable scope (global · role · user) says hide, the feature is
          hidden — and a read error also fails to hidden. Every change here is
          recorded in the Audit log.
        </p>
      </Card>

      {flags.map((flag) => (
        <Card key={flag.key} className="space-y-4">
          <div>
            <h2 className="font-heading text-lg font-bold">
              {flag.label}{" "}
              <span className="font-mono text-xs font-normal text-muted">
                {flag.key}
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted">{flag.description}</p>
          </div>
          <FeatureVisibilityControls flag={flag} />
        </Card>
      ))}
    </section>
  );
}
