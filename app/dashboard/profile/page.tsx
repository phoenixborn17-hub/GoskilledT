// Profile tab (Blueprint §3 · GPS-M2 §2.5): editable name/email/goal, read-only phone, logout.
// No self-serve account deletion in M2 (support-mediated; DPDP flows = LEGAL workstream).
import { getCurrentUserRecord } from "../../../lib/auth/session";
import { ProfileForm } from "../../../components/dashboard/profile-form";
import { EmailPrefToggle } from "../../../components/dashboard/email-pref-toggle";
import { LogoutButton } from "../../../components/dashboard/logout-button";
import { Card, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUserRecord();

  return (
    <section aria-labelledby="profile-heading" className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 id="profile-heading" className="font-heading text-2xl font-bold">
          Profile
        </h1>
        <Badge variant="gold">Founding Batch</Badge>
      </div>

      {/* Referral code display (DR-030 §6.8). Invite-only framing — no earn language pre-D-01. */}
      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-charcoal">
            Your referral code
          </p>
          <p className="font-heading text-lg font-bold tracking-wide text-brand">
            {user?.referralCode ?? "—"}
          </p>
        </div>
        <span className="text-xs text-muted">
          Friends who join with your link stay linked to you.
        </span>
      </Card>

      <Card>
        <CardTitle className="mb-4 text-lg">Your details</CardTitle>
        <ProfileForm
          initialName={user?.name ?? ""}
          initialEmail={user?.email ?? ""}
          initialGoal={user?.goal ?? "BOTH"}
        />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-charcoal">Mobile number</p>
            <p className="text-sm text-muted">
              {user?.phone || "—"} · used to sign in
            </p>
          </div>
          {/* Phone = auth identity: changing it is support-mediated (no self-serve in M2). */}
          <span className="text-xs text-muted">Change via support</span>
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4 text-lg">Email preferences</CardTitle>
        <EmailPrefToggle initialOptedOut={user?.emailOptOut === true} />
      </Card>

      <LogoutButton />
    </section>
  );
}
