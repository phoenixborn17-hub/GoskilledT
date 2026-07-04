// /admin/settings — runtime config visibility + the payout ceremony (GPS-M4 §2.4). Honesty
// dashboard: providers live/dev, env validity, LAUNCH_CONFIG pending count, OTP throttle status.
import { getSettingsOverview } from "../../../lib/admin/settings";
import { PayoutFlagCeremony } from "../../../components/admin/payout-flag-ceremony";
import { PageHeading } from "../../../components/admin/primitives";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettingsOverview();

  return (
    <section className="space-y-6">
      <PageHeading
        title="Settings"
        subtitle="Runtime configuration — read-only honesty dashboard + the payout ceremony."
      />

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold">
          Affiliate payouts flag
        </h2>
        <PayoutFlagCeremony
          enabled={s.payoutsEnabled}
          lcOneFinal={s.lcOneFinal}
        />
      </Card>

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold">Providers</h2>
        <ul className="space-y-1.5 text-sm">
          {s.providers.map((p) => (
            <li
              key={p.key}
              className="flex items-center justify-between border-b border-charcoal/5 pb-1.5 last:border-0"
            >
              <span className="font-mono text-xs text-muted">{p.key}</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold">{p.value}</span>
                {p.dev && <Badge variant="outline">dev</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-heading text-lg font-bold">Environment</h2>
          {s.envIssues.length === 0 ? (
            <p className="text-sm text-brand-deep">
              ✓ All required variables valid.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-red-600">
              {s.envIssues.map((i, idx) => (
                <li key={idx}>• {i}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-heading text-lg font-bold">Launch config</h2>
          <p className="text-sm text-muted">
            {s.launchPending == null
              ? "Registry file not readable at runtime."
              : `${s.launchPending} row(s) still PENDING before go-live.`}
          </p>
          <div className="mt-3 border-t border-charcoal/5 pt-3">
            <p className="text-sm font-medium">OTP send throttle</p>
            <p className="text-xs text-muted">
              {s.otpRateLimit.active ? "Active" : "Inactive"} —{" "}
              {s.otpRateLimit.note}
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
