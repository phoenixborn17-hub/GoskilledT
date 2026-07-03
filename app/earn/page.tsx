// /earn — affiliate waitlist landing (Ticket 6, Task 2). D-01: program "opens after review".
// D-29: NO income claims, NO earnings examples, NO commission numbers on this public page.
import { Suspense } from "react";
import { ShieldCheck, ClipboardCheck, BellRing } from "lucide-react";
import { joinWaitlist } from "./actions";
import { pageMetadata } from "../../lib/seo";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { LeadCaptureForm } from "../../components/marketing/lead-capture-form";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";

export const metadata = pageMetadata({
  title: "Earn with GoSkilled — Waitlist",
  description:
    "Our affiliate program opens after review. Join the waitlist to be first to know when it's live.",
  path: "/earn",
});
export const dynamic = "force-dynamic";

// COPY: draft — honest, no numbers (D-29), gated on review (D-01)
const POINTS = [
  {
    Icon: ShieldCheck,
    title: "Built on trust",
    body: "You'll only ever share skills you believe in — we sell skills, not dreams.",
  },
  {
    Icon: ClipboardCheck,
    title: "Opens after review",
    body: "The program is being finalised and reviewed. Details and terms will be shared before it opens.",
  },
  {
    Icon: BellRing,
    title: "Waitlist first",
    body: "People on the waitlist are the first to know the day it goes live.",
  },
];

export default function EarnPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-4xl gap-8 px-4 py-12 md:grid-cols-2">
        <section>
          <Badge variant="brand">Coming after review</Badge>
          <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight">
            Share what you learn
          </h1>
          {/* COPY: draft — no earnings promise, no numbers */}
          <p className="mt-2 text-charcoal/70">
            We&apos;re building a way for learners to share GoSkilled courses
            with others. It opens once our review is complete — no dates or
            numbers yet. Join the waitlist and you&apos;ll be first to hear.
          </p>
          <div className="mt-6 space-y-3">
            {POINTS.map(({ Icon, title, body }) => (
              <Card key={title} className="flex items-start gap-3 p-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">{title}</p>
                  <p className="text-sm text-muted">{body}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section aria-label="Join the waitlist">
          <Suspense>
            <LeadCaptureForm
              action={joinWaitlist}
              requireName={false}
              submitLabel="Join the waitlist"
              successTitle="You're on the list ✓"
              successBody="You'll be first to know when it opens. In the meantime, keep learning."
              successCta={{ href: "/courses", label: "Explore courses" }}
            />
          </Suspense>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
