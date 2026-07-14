"use client";
// Get-Started checklist (DR-030 §6.2). Renders derived-from-real-data progress; the only client
// bit is the quiet dismiss. Auto-hides at 4/4 with a completion moment. No dark patterns, no
// countdowns — dismiss is always available so a user is never trapped.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Card } from "../../ui/card";
import { dismissChecklist } from "../../../app/dashboard/actions";

export interface ChecklistItemView {
  key: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

export function ChecklistCard({
  items,
  doneCount,
  total,
}: {
  items: ChecklistItemView[];
  doneCount: number;
  total: number;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [pending, startTransition] = useTransition();
  const complete = doneCount >= total;

  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    startTransition(async () => {
      await dismissChecklist();
      router.refresh();
    });
  }

  return (
    <Card className="relative">
      <button
        type="button"
        onClick={dismiss}
        disabled={pending}
        aria-label="Hide checklist"
        className="press absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-charcoal/5"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <div className="mb-4 pr-8">
        <p className="font-heading text-lg font-bold text-ink">
          {complete ? "You're all set 🎉" : "Get started"}
        </p>
        <p className="text-sm text-muted">
          {complete
            ? "You've completed every step. Nice work!"
            : `${doneCount} of ${total} done`}
        </p>
      </div>

      {/* Progress bar — decorative, mirrors the text count (a11y via the text above). */}
      <div
        className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-charcoal/10"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-brand transition-[width]"
          style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
        />
      </div>

      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-charcoal/5"
            >
              {item.done ? (
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-brand"
                  aria-hidden
                />
              ) : (
                <Circle
                  className="h-5 w-5 shrink-0 text-ink-muted"
                  aria-hidden
                />
              )}
              <span
                className={
                  item.done
                    ? "flex-1 text-sm text-muted line-through"
                    : "flex-1 text-sm font-medium text-ink"
                }
              >
                {item.label}
              </span>
              {!item.done && (
                <span className="shrink-0 text-xs font-semibold text-brand">
                  {item.cta} →
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
