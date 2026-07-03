// /webinar — free lead-magnet webinar (Ticket 6, Task 1 · DR-014 free entry). Server component.
// Shows the next webinar or an "announced soon" state; either way it captures the lead.
// D-29: promises learning, never income.
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { getNextWebinar } from "../../lib/crm/webinar";
import { registerWebinar } from "./actions";
import { pageMetadata } from "../../lib/seo";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { LeadCaptureForm } from "../../components/marketing/lead-capture-form";
import { Badge } from "../../components/ui/badge";

export const metadata = pageMetadata({
  title: "Free Webinar",
  description: "Join our free webinar and learn a practical, job-ready skill. Register with just your name and phone.",
  path: "/webinar",
});
export const dynamic = "force-dynamic";

// COPY: draft — learning outcomes only (D-29: no income promises)
const LEARN = [
  "A practical skill you can start using the same day",
  "How our courses work and what's inside",
  "Live Q&A — bring your questions",
];

function formatWhen(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(d);
}

export default async function WebinarPage() {
  const webinar = await getNextWebinar();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-12 md:grid-cols-2">
        <section>
          <Badge variant="gold">Free webinar</Badge>
          {webinar ? (
            <>
              <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight">{webinar.title}</h1>
              <p className="mt-2 font-medium text-brand">{formatWhen(webinar.startsAt)} IST</p>
            </>
          ) : (
            <>
              {/* COPY: draft — no active webinar, still capture the lead */}
              <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight">Our next webinar is announced soon</h1>
              <p className="mt-2 text-charcoal/60">Register now — we&apos;ll message you the moment the date is set.</p>
            </>
          )}

          <h2 className="mt-6 font-heading text-lg font-bold">What you&apos;ll learn</h2>
          <ul className="mt-2 space-y-2">
            {LEARN.map((l) => (
              <li key={l} className="flex items-start gap-2 text-sm text-charcoal/70">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden /> {l}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Register">
          <Suspense>
            <LeadCaptureForm
              action={registerWebinar}
              requireName
              submitLabel="Register free"
              successTitle="You're registered! 🎉"
              successBody="We'll send the joining details to your phone. Add the session to your calendar so you don't miss it."
              successCta={{ href: "/packages", label: "Explore packages meanwhile" }}
            />
          </Suspense>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
