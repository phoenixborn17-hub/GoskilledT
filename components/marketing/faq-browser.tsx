"use client";
// Searchable FAQ browser (client island). Filters real FAQ content by query + category — never
// invents answers (D-29). Progressive: with JS off, the /faq page still renders every category via
// the server accordion; this enhances search on top. Keyboard-accessible, honest empty state.
import * as React from "react";
import { Search, X } from "lucide-react";
import type { FaqCategory } from "../../lib/marketing/faq";
import { cn } from "../../lib/utils";

export function FaqBrowser({ categories }: { categories: FaqCategory[] }) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState<string>("All");
  const tabs = ["All", ...categories.map((c) => c.title)];

  const q = query.trim().toLowerCase();
  const filtered = categories
    .filter((c) => active === "All" || c.title === active)
    .map((c) => ({
      ...c,
      items: c.items.filter(
        (i) =>
          !q || i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q),
      ),
    }))
    .filter((c) => c.items.length > 0);

  const total = filtered.reduce((n, c) => n + c.items.length, 0);

  return (
    <div>
      {/* Search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          aria-label="Search FAQs"
          className="h-12 w-full rounded-xl border border-line/15 bg-surface-raised pl-10 pr-10 text-sm text-ink outline-none placeholder:text-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="press absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-charcoal/5"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by category"
      >
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            aria-pressed={active === t}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              active === t
                ? "border-brand bg-brand text-brand-fg"
                : "border-line/15 text-ink/70 hover:border-brand/30 hover:bg-brand/5",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="mt-8 space-y-10" aria-live="polite">
        {total === 0 ? (
          <div className="rounded-gs-lg border border-line/10 bg-surface-raised p-8 text-center">
            <p className="font-heading text-lg font-bold text-ink">
              No matches for “{query}”
            </p>
            <p className="mt-1 text-sm text-muted">
              Try a different word, or{" "}
              <a href="/contact" className="font-semibold text-brand">
                ask us directly
              </a>
              .
            </p>
          </div>
        ) : (
          filtered.map((cat) => (
            <section key={cat.title} aria-labelledby={`faq-${cat.title}`}>
              <h2
                id={`faq-${cat.title}`}
                className="mb-3 font-heading text-xl font-bold text-ink"
              >
                {cat.title}
              </h2>
              <div className="space-y-2">
                {cat.items.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-xl border border-line/10 bg-surface-raised p-4"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-ink [&::-webkit-details-marker]:hidden">
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
            </section>
          ))
        )}
      </div>
    </div>
  );
}
