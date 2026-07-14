// Branded monogram avatar — initials on the brand green with a gold ring accent. Used where real
// photos aren't available yet (Fable trust override: NO photos, NO AI faces). Deliberately a green
// fill (not a green→gold gradient) so the white initials keep AA contrast — gold is the ring accent
// only (Golden Rule 14: gold is never text/foreground on light). Decorative: the person's name is
// always shown as real text beside it, so this is aria-hidden. Swapping in a real <img> later is a
// drop-in replacement at each call site — no layout change.
import { cn } from "../../lib/utils";

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Monogram({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-16 w-16 shrink-0 items-center justify-center rounded-gs-lg font-heading text-xl font-bold text-white ring-2 ring-gold/70",
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, var(--gs-green-deep), var(--gs-green))",
      }}
    >
      {initialsOf(name)}
    </div>
  );
}
