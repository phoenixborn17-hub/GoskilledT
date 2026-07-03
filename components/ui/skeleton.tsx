import { cn } from "../../lib/utils";

// motion-safe: pulse only when the user hasn't asked to reduce motion.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-charcoal/10 motion-safe:animate-pulse",
        className,
      )}
      aria-hidden
    />
  );
}
