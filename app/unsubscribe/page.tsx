// GPS-M5 §2.4 — one-click unsubscribe (public; the emailed link carries `?u=<userId>&sig=<hmac>`).
// The HMAC sig proves we issued the link, so it can't be forged/tampered to opt out another learner
// (Fable Tier-A cond. 3). Confirm-on-SUBMIT (not on load) so email-scanner prefetch can't accidentally
// opt a learner out. Idempotent + reversible from Settings. No auth (logged-out users get emails too).
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, MailX, ShieldAlert } from "lucide-react";
import { prisma } from "../../lib/prisma";
import {
  verifyUnsubscribe,
  unsubscribeKey,
} from "../../lib/email/unsubscribe-token";
import { Card, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

async function unsubscribe(formData: FormData): Promise<void> {
  "use server";
  const u = String(formData.get("u") ?? "").trim();
  const sig = String(formData.get("sig") ?? "").trim();
  // Verify the HMAC before mutating — a missing/forged sig is rejected (never opts anyone out).
  if (u && verifyUnsubscribe(u, sig, unsubscribeKey())) {
    // Update is safe + idempotent. Swallow errors (best-effort).
    await prisma.user
      .update({ where: { id: u }, data: { emailOptOut: true } })
      .catch(() => {});
    redirect("/unsubscribe?done=1");
  }
  redirect("/unsubscribe?bad=1");
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{
    u?: string;
    sig?: string;
    done?: string;
    bad?: string;
  }>;
}) {
  const { u, sig, done, bad } = await searchParams;
  const validLink = !!u && verifyUnsubscribe(u, sig ?? "", unsubscribeKey());

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-16">
      {done ? (
        <Card className="w-full text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand"
            aria-hidden
          >
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle>You&apos;re unsubscribed</CardTitle>
          <CardDescription>
            Aapko ab GoSkilled emails nahi aayenge. Wapas on karna ho to
            Settings me kabhi bhi kar sakte ho.
          </CardDescription>
          <div className="mx-auto mt-5 max-w-xs">
            <Link href="/dashboard/profile">
              <Button variant="outline">Go to settings</Button>
            </Link>
          </div>
        </Card>
      ) : bad || !validLink ? (
        <Card className="w-full text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/5 text-muted"
            aria-hidden
          >
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle>This link isn&apos;t valid</CardTitle>
          <CardDescription>
            Ye unsubscribe link expire ho gaya ya galat hai. Aap Settings se
            apni email preferences kabhi bhi change kar sakte ho.
          </CardDescription>
          <div className="mx-auto mt-5 max-w-xs">
            <Link href="/dashboard/profile">
              <Button variant="outline">Go to settings</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="w-full text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/5 text-muted"
            aria-hidden
          >
            <MailX className="h-6 w-6" />
          </div>
          <CardTitle>Unsubscribe from emails?</CardTitle>
          <CardDescription>
            Ye welcome + certificate emails band kar dega. Aap kabhi bhi
            Settings se wapas on kar sakte ho.
          </CardDescription>
          <form action={unsubscribe} className="mx-auto mt-5 max-w-xs">
            <input type="hidden" name="u" value={u ?? ""} />
            <input type="hidden" name="sig" value={sig ?? ""} />
            <Button type="submit">Unsubscribe</Button>
          </form>
        </Card>
      )}
    </main>
  );
}
