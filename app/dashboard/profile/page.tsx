// Profile (Blueprint §3 · GPS-M2 §2.5 · Redesign U6): editable name/email/goal, read-only phone,
// referral code, logout. Notification prefs moved to Account · Settings (single home). No self-serve
// account deletion (support-mediated; DPDP = LEGAL workstream). Auth/profile writes unchanged.
import { getCurrentUserRecord } from "../../../lib/auth/session";
import { greetingTitle } from "../../../lib/greeting";
import { ProfileForm } from "../../../components/dashboard/profile-form";
import { LogoutButton } from "../../../components/dashboard/logout-button";
import { Card, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUserRecord();

  return (
    <section aria-labelledby="profile-heading" className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1
            id="profile-heading"
            className="font-heading text-h1 font-bold text-ink"
          >
            Profile
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            {greetingTitle(user?.name)}
          </p>
        </div>
        <Badge variant="gold">Founding Batch</Badge>
      </header>

      {/* Referral code (DR-030 §6.8) — invite-only framing, no earn language pre-D-01. */}
      <Card className="flex items-center justify-between gap-3">
        <div>
          <p className="text-small font-medium text-ink">Your referral code</p>
          <p className="font-heading text-h4 font-bold tracking-wide text-theme-strong">
            {user?.referralCode ?? "—"}
          </p>
        </div>
        <span className="text-caption text-ink-muted">
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
            <p className="text-small font-medium text-ink">Mobile number</p>
            <p className="text-small text-ink-muted">
              {user?.phone || "—"} · used to sign in
            </p>
          </div>
          {/* Phone = auth identity: changing it is support-mediated (no self-serve in M2). */}
          <span className="text-caption text-ink-muted">
            Change via support
          </span>
        </div>
      </Card>

      <LogoutButton />
    </section>
  );
}
