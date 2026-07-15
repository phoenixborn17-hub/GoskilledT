// Sticky mobile CTA (Public Experience charter: thumb-first, one-hand, bottom action). Mobile only
// (hidden on lg+ where the header CTA is always visible). Server component — zero client JS. Glass
// for depth; honours the iOS safe-area. The page adds matching bottom padding so nothing is covered.
import Link from "next/link";

export function MobileCtaBar() {
  return (
    <div
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/10 px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 lg:hidden"
      role="region"
      aria-label="Quick start"
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <Link
          href="/webinar"
          className="press inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-brand/30 text-sm font-semibold text-ink"
        >
          Free webinar
        </Link>
        <Link
          href="/register"
          className="press inline-flex h-11 flex-[1.4] items-center justify-center rounded-xl bg-brand text-sm font-semibold text-brand-fg"
        >
          Register free
        </Link>
      </div>
    </div>
  );
}
