// Skeleton for the Profile tab.
import { Skeleton } from "../../../components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <section className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-72 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </section>
  );
}
