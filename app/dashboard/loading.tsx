// Skeleton for the Learn tab — never blank while enrollments load.
import { Skeleton } from "../../components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-28 w-full rounded-gs-lg" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-gs-lg" />
        ))}
      </div>
    </section>
  );
}
