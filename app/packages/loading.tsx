// Skeleton state for /packages — no blank screen while packages load.
import { SiteHeader } from "../../components/marketing/site-header";
import { Skeleton } from "../../components/ui/skeleton";

export default function PackagesLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 pt-10">
        <div className="text-center">
          <Skeleton className="mx-auto mb-2 h-9 w-64" />
          <Skeleton className="mx-auto h-4 w-80 max-w-full" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    </>
  );
}
