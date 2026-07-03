// /webinar — two-session model (Phase 1B spec): Sunday FREE INTRODUCTION WEBINAR is primary (open
// registration for new learners); Friday LIVE SKILL TRAINING is for enrolled learners and routes to
// /login. Registration flow is unchanged (same registerWebinar action + LeadCaptureForm).
// D-29: promises learning, never income.
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, CalendarClock, GraduationCap } from "lucide-react";
import { getNextWebinar } from "../../lib/crm/webinar";
import { registerWebinar } from "./actions";
import { pageMetadata } from "../../lib/seo";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
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

// The Sunday intro webinar covers exactly this (Phase 1B spec, live-sessions answer). D-29 clean.
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

export default async function WebinarPage() {
  const webinar = await getNextWebinar();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-12">
        {/* Primary: Sunday Free Introduction Webinar */}
        <div className="grid gap-8 md:grid-cols-2">
          <section>
            <Badge variant="gold">Free · Every Sunday</Badge>
            {webinar ? (
              <>
                <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight">
                  {webinar.title}
                </h1>
                <p className="mt-2 font-medium text-brand">
                  {formatWhen(webinar.startsAt)} IST
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight">
                  Free Introduction Webinar
                </h1>
                <p className="mt-2 text-muted">
                  A free session for new learners, every Sunday. Register now
                  and we&apos;ll message you the joining details.
                </p>
              </>
            )}

            <h2 className="mt-6 font-heading text-lg font-bold">
              What you&apos;ll learn
            </h2>
            <ul className="mt-2 space-y-2">
              {LEARN.map((l) => (
                <li
                  key={l}
                  className="flex items-start gap-2 text-sm text-charcoal/70"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                    aria-hidden
                  />{" "}
                  {l}
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
                successCta={{
                  href: "/packages",
                  label: "Explore packages meanwhile",
                }}
              />
            </Suspense>
          </section>
        </div>

        {/* Secondary: Friday Live Skill Training for enrolled learners → /login */}
        <section aria-labelledby="friday" className="mt-12">
          <Card className="flex flex-col gap-4 bg-brand/5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
                aria-hidden
              >
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h2
                  id="friday"
                  className="font-heading text-lg font-bold text-charcoal"
                >
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
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
