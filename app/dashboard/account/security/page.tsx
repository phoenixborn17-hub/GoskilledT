// Account · Security (Redesign U6 · NEW). Password change (user-performed) + active-session control.
// Auth stays with Supabase (DR-024); nothing here is automated — the user performs each action.
import { Monitor, LogOut } from "lucide-react";
import { getCurrentUserRecord } from "../../../../lib/auth/session";
import { greetingTitle } from "../../../../lib/greeting";
import { signOutEverywhereAction } from "../actions";
import { ChangePasswordForm } from "../../../../components/dashboard/change-password-form";
import {
  Card,
  CardTitle,
  CardDescription,
} from "../../../../components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Security" };

export default async function SecurityPage() {
  const user = await getCurrentUserRecord();

  return (
    <section aria-labelledby="security-heading" className="space-y-6">
      <header>
        <h1
          id="security-heading"
          className="font-heading text-h1 font-bold text-ink"
        >
          Security
        </h1>
        <p className="mt-1 text-body text-ink-muted">
          {greetingTitle(user?.name)} — keep your account safe.
        </p>
      </header>

      <Card>
        <CardTitle className="mb-1 text-lg">Change password</CardTitle>
        <CardDescription className="mb-4">
          Choose a new password for signing in. You&apos;ll stay signed in on
          this device.
        </CardDescription>
        <ChangePasswordForm />
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle className="mb-1 text-lg">Active sessions</CardTitle>
          <CardDescription>
            Signed out somewhere you don&apos;t recognise? Sign out of all
            devices and sign back in.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 rounded-gs border border-line bg-surface-sunken px-4 py-3">
          <Monitor className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-small font-medium text-ink">This device</p>
            <p className="text-caption text-ink-muted">
              Signed in with {user?.phone || "your mobile number"}
            </p>
          </div>
        </div>
        <form action={signOutEverywhereAction}>
          <button
            type="submit"
            className="press inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-small font-semibold text-ink hover:bg-charcoal/5"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out of all devices
          </button>
        </form>
      </Card>
    </section>
  );
}
