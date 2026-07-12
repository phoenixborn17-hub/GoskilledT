// In-app Webinars page (Command_Center_Spec §4.3 · Slice 5) — the last frequent app→marketing
// crossing, closed. Thin wrapper over the SAME real data + registration action the public /webinar
// page uses (getNextWebinar + registerWebinar — no new CRM logic). Honest: only the real scheduled
// session, real countdown, no fabricated seats/attendee counts (D-29). Public /webinar remains the
// logged-out acquisition surface.
import { Suspense } from "react";
import { CalendarPlus, CheckCircle2, MessageCircle } from "lucide-react";
import { getNextWebinar } from "../../../../lib/crm/webinar";
import { registerWebinar } from "../../../webinar/actions";
import { Badge } from "../../../../components/ui/badge";
import { DecisionCard } from "../../../../components/cards/decision/decision-card";
import { WebinarCountdown } from "../../../../components/marketing/webinar-countdown";
import { LeadCaptureForm } from "../../../../components/marketing/lead-capture-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Webinars" };

const LEARN = [
  "What GoSkilled is and how the learning works",
  "The learning roadmap and how the packages fit",
  "How to get started — plus live Q&A",
];

function formatWhen(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

// Google Calendar "add event" link built from the real session time (convenience, not a claim).
function gcalLink(title: string, startsAt: Date): string {
  const end = new Date(startsAt.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const u = new URL("https://calendar.google.com/calendar/render");
  u.searchParams.set("action", "TEMPLATE");
  u.searchParams.set("text", title);
  u.searchParams.set("dates", `${fmt(startsAt)}/${fmt(end)}`);
  u.searchParams.set(
    "details",
    "Free GoSkilled Introduction Webinar — joining link sent to your phone.",
  );
  return u.toString();
}

export default async function WebinarsPage() {
  const webinar = await getNextWebinar();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-h1 font-extrabold text-ink">
          Webinars
        </h1>
        <p className="mt-1 text-body text-ink-muted">
          Live sessions with the founder — free, every Sunday.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,22rem]">
        <DecisionCard
          icon={CalendarPlus}
          label="Next session"
          accent="info"
          size="primary"
          badge={webinar ? { label: "Free", tone: "new" } : undefined}
        >
          {webinar ? (
            <div className="space-y-4">
              <div>
                <h2 className="font-heading text-h3 font-bold text-ink">
                  {webinar.title}
                </h2>
                <p className="mt-1 text-small font-medium text-theme-strong">
                  {formatWhen(webinar.startsAt)} IST
                </p>
              </div>
              <WebinarCountdown targetIso={webinar.startsAt.toISOString()} />
              <a
                href={gcalLink(webinar.title, webinar.startsAt)}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex items-center gap-2 rounded-xl border border-theme/25 px-4 py-2 text-small font-semibold text-ink hover:bg-theme/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme focus-visible:ring-offset-2"
              >
                <CalendarPlus
                  className="h-4 w-4 text-theme-strong"
                  aria-hidden
                />
                Add to Google Calendar
              </a>
              <ul className="space-y-2 border-t border-line pt-4">
                {LEARN.map((l) => (
                  <li
                    key={l}
                    className="flex items-start gap-2 text-small text-ink-muted"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-theme-strong"
                      aria-hidden
                    />
                    {l}
                  </li>
                ))}
              </ul>
              <p className="inline-flex items-center gap-1.5 text-caption text-ink-muted">
                <MessageCircle
                  className="h-4 w-4 text-theme-strong"
                  aria-hidden
                />
                Joining link is sent to your phone — no payment, no pressure.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="font-heading text-h3 font-bold text-ink">
                No session scheduled right now
              </h2>
              <p className="mt-2 max-w-prose text-body text-ink-muted">
                The next Sunday session will appear here as soon as it&apos;s
                scheduled. Register below and we&apos;ll message you the
                joining details.
              </p>
            </div>
          )}
        </DecisionCard>

        {/* Same registration action as the public page — the joining link goes to the phone. */}
        <section aria-label="Register" className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="gold">Free</Badge>
            <p className="text-small font-semibold text-ink">
              Save your seat
            </p>
          </div>
          <Suspense>
            <LeadCaptureForm
              action={registerWebinar}
              requireName
              submitLabel="Register free"
              successTitle="You're registered! 🎉"
              successBody="We'll send the joining details to your phone. Add the session to your calendar so you don't miss it."
              successCta={{
                href: "/dashboard/learn/browse",
                label: "Browse courses meanwhile",
              }}
            />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
