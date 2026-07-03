// Skeleton state for /courses/[slug] — no blank screen while the course detail loads.
import { SiteHeader } from "../../../components/marketing/site-header";
import { Skeleton } from "../../../components/ui/skeleton";

export default function CourseDetailLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <Skeleton className="mb-3 h-6 w-24 rounded-full" />
        <Skeleton className="mb-3 h-10 w-3/4" />
        <Skeleton className="mb-6 h-4 w-full max-w-lg" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </main>
    </>
  );
}
