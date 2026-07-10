// Marketing loading skeletons (route-level loading.tsx). Branded shimmer that matches the final
// layout (zero CLS). Server component — the shimmer is CSS-only and respects reduced motion via the
// shared .skeleton utility. Used by /courses, /courses/[slug], /packages loading states.
import { MarketingShell } from "./marketing-shell";
import { Container } from "./kit";

function Bar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-charcoal/10 motion-reduce:animate-none ${className}`}
    />
  );
}

/** Grid-of-cards skeleton (Courses / catalog listings). */
export function CardsGridSkeleton() {
  return (
    <MarketingShell>
      <main>
        <div className="hero-aurora">
          <Container className="py-16 text-center">
            <Bar className="mx-auto h-8 w-40" />
            <Bar className="mx-auto mt-4 h-10 w-80 max-w-full" />
            <Bar className="mx-auto mt-3 h-4 w-96 max-w-full" />
          </Container>
        </div>
        <Container className="py-12">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white"
              >
                <Bar className="h-24 rounded-none" />
                <div className="space-y-3 p-5">
                  <Bar className="h-5 w-3/4" />
                  <Bar className="h-4 w-full" />
                  <Bar className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </main>
    </MarketingShell>
  );
}

/** Detail-page skeleton (Course detail / content + sidebar). */
export function DetailSkeleton() {
  return (
    <MarketingShell>
      <div className="hero-aurora">
        <Container className="py-12">
          <Bar className="h-4 w-32" />
          <Bar className="mt-4 h-9 w-2/3" />
          <Bar className="mt-3 h-4 w-1/2" />
        </Container>
      </div>
      <Container className="grid gap-10 py-12 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Bar className="h-6 w-48" />
          <Bar className="h-32 w-full" />
          <Bar className="h-40 w-full" />
        </div>
        <div>
          <Bar className="h-72 w-full rounded-2xl" />
        </div>
      </Container>
    </MarketingShell>
  );
}
