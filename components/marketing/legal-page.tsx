// Shared shell for legal stub pages (Ticket 5, Task 4 — footer links must never 404).
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-heading text-3xl font-extrabold">{title}</h1>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-charcoal/70">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
