// Profile tab (Blueprint §3 · GPS-M2 §2.5): editable name/email/goal, read-only phone, logout.
// No self-serve account deletion in M2 (support-mediated; DPDP flows = LEGAL workstream).
import { getCurrentUserRecord } from "../../../lib/auth/session";
import { ProfileForm } from "../../../components/dashboard/profile-form";
import { LogoutButton } from "../../../components/dashboard/logout-button";
import { Card, CardTitle } from "../../../components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUserRecord();

  return (
    <section aria-labelledby="profile-heading" className="space-y-6">
      <h1 id="profile-heading" className="font-heading text-2xl font-bold">
        Profile
      </h1>

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

      <LogoutButton />
    </section>
  );
}
