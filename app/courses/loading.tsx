// Skeleton state for /courses — no blank screen while data loads.
import { SiteHeader } from "../../components/marketing/site-header";
import { CourseCardSkeleton } from "../../components/marketing/course-card-skeleton";
import { Skeleton } from "../../components/ui/skeleton";

export default function CoursesLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <Skeleton className="mb-2 h-9 w-40" />
        <Skeleton className="mb-6 h-4 w-72" />
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </>
  );
}
