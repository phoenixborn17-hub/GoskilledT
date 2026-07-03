import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function CourseCardSkeleton() {
  return (
    <Card className="flex h-full flex-col gap-3">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="mt-auto space-y-2 pt-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </Card>
  );
}
