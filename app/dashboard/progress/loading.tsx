// Skeleton for the Progress tab.
import { Skeleton } from "../../../components/ui/skeleton";

export default function ProgressLoading() {
  return (
    <section className="space-y-6">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-gs-lg" />
      ))}
    </section>
  );
}
