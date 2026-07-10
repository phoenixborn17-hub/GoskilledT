// My-Leads (Phase D · D3). MINIMAL consumer surface. An affiliate's own uploaded leads, owner-scoped,
// with a date filter. Phone/email are stored encrypted and decrypted server-side only for the owner.
// ⚠️ PII surface — flagged for Fable (owner sees full phone of their own leads; retention TBD).
import Link from "next/link";
import { getCurrentUser } from "../../../../lib/auth/session";
import { listAffiliateLeads } from "../../../../lib/affiliate/leads";
import { AddLeadForm } from "../../../../components/affiliate/add-lead-form";
import { Card, CardTitle } from "../../../../components/ui/card";

export const dynamic = "force-dynamic";

type Range = "30d" | "90d" | "all";

function fromForRange(range: Range, now: Date): Date | undefined {
  if (range === "30d") return new Date(now.getTime() - 30 * 864e5);
  if (range === "90d") return new Date(now.getTime() - 90 * 864e5);
  return undefined;
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export default async function MyLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const range: Range =
    sp.range === "30d" || sp.range === "90d" ? sp.range : "all";
  const leads = await listAffiliateLeads(user!.id, {
    from: fromForRange(range, new Date()),
  });

  return (
    <section aria-labelledby="ml-heading" className="space-y-6">
      <h1 id="ml-heading" className="font-heading text-h1 font-bold text-ink">
        My Leads
      </h1>

      <Card className="space-y-3">
        <CardTitle className="text-base">Add a lead</CardTitle>
        <p className="text-sm text-muted">
          Keep track of people you&apos;re inviting. Only you can see these — we
          store contact details encrypted.
        </p>
        <AddLeadForm />
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">
            Your leads · {leads.length}
          </CardTitle>
          <div className="flex gap-1 text-sm">
            {(["30d", "90d", "all"] as Range[]).map((r) => (
              <Link
                key={r}
                href={`/dashboard/earn/my-leads${r === "all" ? "" : `?range=${r}`}`}
                aria-current={range === r ? "true" : undefined}
                className={
                  "rounded-full px-3 py-1 font-medium " +
                  (range === r
                    ? "bg-charcoal text-white"
                    : "bg-charcoal/5 text-charcoal/70 hover:bg-charcoal/10")
                }
              >
                {r === "all" ? "All" : r === "30d" ? "30d" : "90d"}
              </Link>
            ))}
          </div>
        </div>
        {leads.length === 0 ? (
          <p className="rounded-xl bg-charcoal/5 p-4 text-sm text-muted">
            No leads in this period yet. Add one above to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Mobile</th>
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Added</th>
                  <th className="py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 pr-3 font-medium text-charcoal">
                      {l.name || "—"}
                    </td>
                    <td className="py-2 pr-3 text-muted">{l.phone}</td>
                    <td className="py-2 pr-3 text-muted">{l.email || "—"}</td>
                    <td className="py-2 pr-3 text-muted">
                      {fmtDate(l.createdAt)}
                    </td>
                    <td className="py-2 text-muted">{l.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
