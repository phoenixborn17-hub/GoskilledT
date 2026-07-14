// /webinar — two-session model (Phase 1B spec): Sunday FREE INTRODUCTION WEBINAR is primary (open
// registration for new learners); Friday LIVE SKILL TRAINING is for enrolled learners and routes to
// /login. Registration flow is unchanged (same registerWebinar action + LeadCaptureForm).
// D-29: promises learning, never income. Re-skinned to the Public Experience standard; no fabricated
// seats/attendee counts — only the real scheduled session + countdown.
import { Suspense } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CalendarClock,
  GraduationCap,
  CalendarPlus,
  MessageCircle,
} from "lucide-react";
import { getNextWebinar } from "../../lib/crm/webinar";
import { registerWebinar } from "./actions";
import { pageMetadata, eventJsonLd } from "../../lib/seo";
import { MarketingShell } from "../../components/marketing/marketing-shell";
import { Container } from "../../components/marketing/kit";
import { WebinarCountdown } from "../../components/marketing/webinar-countdown";
import { Monogram } from "../../components/marketing/monogram";
import { LeadCaptureForm } from "../../components/marketing/lead-capture-form";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export const metadata = pageMetadata({
  title: "Free Introduction Webinar",
  description:
    "Join our free Sunday introduction webinar — what GoSkilled is, the learning roadmap, packages, and how to get started. Register with just your name and phone.",
  path: "/webinar",
});
export const dynamic = "force-dynamic";

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

export default async function WebinarPage() {
  const webinar = await getNextWebinar();

  return (
    <MarketingShell>
      {webinar && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(eventJsonLd(webinar)),
          }}
        />
      )}
      <section className="hero-aurora">
        <Container className="py-12 sm:py-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <Badge variant="gold">Free · Every Sunday</Badge>
              <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
                {webinar ? webinar.title : "Free Introduction Webinar"}
              </h1>
              {webinar ? (
                <>
                  <p className="mt-2 font-medium text-brand">
                    {formatWhen(webinar.startsAt)} IST
                  </p>
                  <div className="mt-5">
                    <WebinarCountdown
                      targetIso={webinar.startsAt.toISOString()}
                    />
                  </div>
                  <a
                    href={gcalLink(webinar.title, webinar.startsAt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press mt-5 inline-flex items-center gap-2 rounded-xl border border-brand/25 px-4 py-2 text-sm font-semibold text-ink hover:bg-brand/5"
                  >
                    <CalendarPlus className="h-4 w-4 text-brand" aria-hidden />
                    Add to Google Calendar
                  </a>
                </>
              ) : (
                <p className="mt-2 text-muted">
                  A free session for new learners, every Sunday. Register now
                  and we&apos;ll message you the joining details.
                </p>
              )}
            </div>

            <section aria-label="Register">
              <Suspense>
                <LeadCaptureForm
                  action={registerWebinar}
                  requireName
                  submitLabel="Register free"
                  successTitle="You're registered! 🎉"
                  successBody="We'll send the joining details to your phone. Add the session to your calendar so you don't miss it."
                  successCta={{
                    href: "/packages",
                    label: "Explore packages meanwhile",
                  }}
                />
              </Suspense>
            </section>
          </div>
        </Container>
      </section>

      <Container className="grid gap-8 py-14 md:grid-cols-2">
        {/* Agenda */}
        <section aria-labelledby="agenda">
          <h2
            id="agenda"
            className="font-heading text-xl font-bold text-ink"
          >
            What you&apos;ll learn
          </h2>
          <ul className="mt-4 space-y-3">
            {LEARN.map((l) => (
              <li
                key={l}
                className="flex items-start gap-2.5 text-sm text-ink/80"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand"
                  aria-hidden
                />
                {l}
              </li>
            ))}
          </ul>
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted">
            <MessageCircle className="h-4 w-4 text-brand" aria-hidden />
            Joining link is sent to your phone — no payment, no pressure.
          </p>
        </section>

        {/* Speaker */}
        <section aria-labelledby="speaker">
          <h2
            id="speaker"
            className="font-heading text-xl font-bold text-ink"
          >
            Your host
          </h2>
          <Card className="mt-4 flex items-center gap-4">
            <Monogram name="Ashish Sangwal" className="h-14 w-14 text-lg" />
            <div>
              <p className="font-semibold text-ink">
                Ashish Sangwal · Founder, GoSkilled
              </p>
              <p className="text-sm text-muted">
                IIM Rohtak. Hosts the session and answers your questions live.
              </p>
            </div>
          </Card>
        </section>
      </Container>

      {/* Friday Live Skill Training (enrolled learners → /login) */}
      <Container className="pb-16">
        <Card className="flex flex-col gap-4 bg-brand/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
              aria-hidden
            >
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-ink">
                Live Skill Training · Every Friday
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
                For enrolled learners — deeper, hands-on sessions on what
                you&apos;re learning.
              </p>
            </div>
          </div>
          <div className="shrink-0 sm:w-44">
            <Link href="/login">
              <Button variant="outline">Log in to join</Button>
            </Link>
          </div>
        </Card>
      </Container>
    </MarketingShell>
  );
}
