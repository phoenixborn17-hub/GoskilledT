// Skeleton for the Earn section — never blank while flag/ledger reads resolve.
import { Skeleton } from "../../../components/ui/skeleton";

export default function EarnLoading() {
  return (
    <section className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-40 w-full rounded-gs-lg" />
      <Skeleton className="h-24 w-full rounded-gs-lg" />
    </section>
  );
}
