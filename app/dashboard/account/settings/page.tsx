// Account · Settings (Redesign U6 · NEW). Notification preferences (existing email opt-out) +
// language + theme. Lean + honest: language is Hinglish (the product default) and theme is Light —
// both shown truthfully with what's coming, never a fake toggle (D-29).
import { Languages, Sun } from "lucide-react";
import { getCurrentUserRecord } from "../../../../lib/auth/session";
import { EmailPrefToggle } from "../../../../components/dashboard/email-pref-toggle";
import {
  Card,
  CardTitle,
  CardDescription,
} from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUserRecord();

  return (
    <section aria-labelledby="settings-heading" className="space-y-6">
      <h1
        id="settings-heading"
        className="font-heading text-h1 font-bold text-ink"
      >
        Settings
      </h1>

      <Card>
        <CardTitle className="mb-1 text-lg">Notifications</CardTitle>
        <CardDescription className="mb-4">
          Choose whether we email you about lessons, webinars and updates.
        </CardDescription>
        <EmailPrefToggle initialOptedOut={user?.emailOptOut === true} />
      </Card>

      <Card className="space-y-3">
        <CardTitle className="text-lg">Language</CardTitle>
        <div className="flex items-center gap-3 rounded-gs border border-line bg-surface-sunken px-4 py-3">
          <Languages className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-small font-medium text-ink">
              Hinglish{" "}
              <Badge variant="muted" className="ml-1 align-middle">
                Default
              </Badge>
            </p>
            <p className="text-caption text-ink-muted">
              GoSkilled speaks Hinglish. More language options are on the way.
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <CardTitle className="text-lg">Theme</CardTitle>
        <div className="flex items-center gap-3 rounded-gs border border-line bg-surface-sunken px-4 py-3">
          <Sun className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-small font-medium text-ink">
              Light{" "}
              <Badge variant="muted" className="ml-1 align-middle">
                On
              </Badge>
            </p>
            <p className="text-caption text-ink-muted">
              A dark mode is designed and coming soon.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
