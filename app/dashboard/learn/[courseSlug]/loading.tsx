// Skeleton for the course player — poster-first: player block, then lesson list.
import { Skeleton } from "../../../../components/ui/skeleton";

export default function PlayerLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-6 md:grid-cols-[1fr,18rem]">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
