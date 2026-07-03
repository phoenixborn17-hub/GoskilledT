// /admin/review-queue (Ticket 6, Task 3) — FLAG_MANUAL_REVIEW items (DR-025 post-window refunds
// & amount mismatches surface here). Pending shown first; "mark resolved" writes an audit row.
import { listReviewQueue } from "../../../lib/admin/queries";
import { ResolveButton } from "../../../components/admin/resolve-button";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default async function ReviewQueuePage() {
  const items = await listReviewQueue();
  const pending = items.filter((i) => !i.resolved);
  const resolved = items.filter((i) => i.resolved);

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Review queue</h1>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Pending <span className="text-muted">({pending.length})</span></h2>
        {pending.length === 0 ? (
          <Card className="text-center text-muted">Nothing pending. 🎉</Card>
        ) : (
          pending.map((i) => (
            <Card key={i.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Order {i.orderId ?? "—"}</p>
                {/* COPY: draft — reason from the webhook flag */}
                <p className="text-sm text-muted">{i.reason ?? "Manual review flagged"}</p>
                <p className="mt-1 text-xs text-muted">{fmtDate(i.createdAt)}</p>
              </div>
              {i.orderId && <ResolveButton orderId={i.orderId} />}
            </Card>
          ))
        )}
      </div>

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-muted">Resolved <span className="text-muted">({resolved.length})</span></h2>
          {resolved.map((i) => (
            <Card key={i.id} className="flex items-center justify-between gap-3 opacity-70">
              <div className="min-w-0">
                <p className="text-sm font-medium">Order {i.orderId ?? "—"}</p>
                <p className="text-sm text-muted">{i.reason ?? "Manual review"}</p>
              </div>
              <Badge variant="muted">Resolved</Badge>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
