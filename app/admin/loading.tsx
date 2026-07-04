// Shared admin loading contract (GPS-M4 §1 — every screen has empty/skeleton/error/retry). Applies
// to every /admin/* route that doesn't ship its own loading.tsx.
import { Skeleton } from "../../components/ui/skeleton";

export default function AdminLoading() {
  return (
    <section className="space-y-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </section>
  );
}
