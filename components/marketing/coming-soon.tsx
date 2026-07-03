// Designed "coming soon" / vision-state shell for planned public sections (/blog, /videos).
// On-brand, honest about being a planned state, and always routes the visitor to a live action.
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export function ComingSoon({
  badge,
  Icon,
  title,
  intro,
  planned,
  cta,
}: {
  badge: string;
  Icon: LucideIcon;
  title: string;
  intro: string;
  planned: { title: string; body: string }[];
  cta: { href: string; label: string; sub: string };
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-16">
        <div className="hero-aurora -mx-4 rounded-3xl px-4 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand" aria-hidden>
            <Icon className="h-7 w-7" />
          </div>
          <Badge variant="brand">{badge}</Badge>
          <h1 className="enter mt-3 font-heading text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="enter enter-2 mx-auto mt-3 max-w-xl text-muted">{intro}</p>
        </div>

        <section aria-label="What's coming" className="reveal mt-10 grid gap-4 sm:grid-cols-3">
          {planned.map((p) => (
            <Card key={p.title} className="h-full">
              <p className="font-heading text-base font-bold">{p.title}</p>
              <p className="mt-1 text-sm text-muted">{p.body}</p>
            </Card>
          ))}
        </section>

        <section className="reveal mt-10">
          <Card className="flex flex-col items-center gap-3 bg-brand text-center text-brand-fg">
            <h2 className="font-heading text-xl font-bold">{cta.sub}</h2>
            <div className="w-full max-w-xs">
              <Link href={cta.href}><Button variant="outline" className="border-brand-fg/50 text-brand-fg hover:bg-white/15">{cta.label}</Button></Link>
            </div>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
