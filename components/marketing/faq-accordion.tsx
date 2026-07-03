// Reusable FAQ accordion (server component, native <details> — no client JS, keyboard-friendly).
import type { FaqItem } from "../../lib/marketing/faq";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((f) => (
        <details
          key={f.q}
          className="group rounded-xl border border-charcoal/10 bg-white p-4"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-charcoal [&::-webkit-details-marker]:hidden">
            {f.q}
            <span
              className="shrink-0 text-brand transition-transform group-open:rotate-45"
              aria-hidden
            >
              +
            </span>
          </summary>
          <p className="mt-2 text-sm text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
