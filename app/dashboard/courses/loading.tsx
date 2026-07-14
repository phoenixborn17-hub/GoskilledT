// Skeleton for My courses — never blank while entitlement loads.
import { Skeleton } from "../../../components/ui/skeleton";

export default function MyCoursesLoading() {
  return (
    <section className="space-y-8">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-gs-lg" />
        ))}
      </div>
    </section>
  );
}
