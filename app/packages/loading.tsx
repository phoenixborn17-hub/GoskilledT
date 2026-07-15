// Skeleton for /packages — matches the re-skinned layout (shell + two plan cards), zero CLS.
import { MarketingShell } from "../../components/marketing/marketing-shell";
import { Container } from "../../components/marketing/kit";

export default function PackagesLoading() {
  return (
    <MarketingShell>
      <main>
        <div className="hero-aurora">
          <Container className="py-16 text-center">
            <div className="mx-auto h-8 w-48 animate-pulse rounded-md bg-charcoal/10 motion-reduce:animate-none" />
            <div className="mx-auto mt-4 h-10 w-72 max-w-full animate-pulse rounded-md bg-charcoal/10 motion-reduce:animate-none" />
          </Container>
        </div>
        <Container className="pb-12">
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-gs-lg border border-line/10 bg-surface-raised motion-reduce:animate-none"
              />
            ))}
          </div>
        </Container>
      </main>
    </MarketingShell>
  );
}
