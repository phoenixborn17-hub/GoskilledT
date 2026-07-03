// /admin/leads (Ticket 6, Task 3) — leads table with an audited stage dropdown. Filter by stage.
import Link from "next/link";
import { listLeads } from "../../../lib/admin/queries";
import type { LeadStage } from "../../../modules/crm/lead";
import { LeadStageSelect } from "../../../components/admin/lead-stage-select";
import { cn } from "../../../lib/utils";

export const dynamic = "force-dynamic";

const STAGES: LeadStage[] = ["NEW", "CONTACTED", "WEBINAR_REGISTERED", "CONVERTED", "LOST"];

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(d);
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const { stage: stageParam } = await searchParams;
  const stage = STAGES.includes(stageParam as LeadStage) ? (stageParam as LeadStage) : undefined;
  const leads = await listLeads({ stage });

  return (
    <section className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Leads</h1>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by stage">
        <FilterChip href="/admin/leads" active={!stage}>All</FilterChip>
        {STAGES.map((s) => (
          <FilterChip key={s} href={`/admin/leads?stage=${s}`} active={stage === s}>{s.replace("_", " ")}</FilterChip>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-charcoal/10 bg-white">
        <table className="w-full min-w-[52rem] text-sm">
          <thead className="border-b border-charcoal/10 text-left text-charcoal/50">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">UTM (src/med/camp)</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">No leads.</td></tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3">{l.name ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{l.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-charcoal/60">{l.source ?? "—"}</td>
                  <td className="px-4 py-3"><LeadStageSelect leadId={l.id} stage={l.stage} /></td>
                  <td className="px-4 py-3 text-xs text-charcoal/40">{[l.utmSource, l.utmMedium, l.utmCampaign].map((x) => x ?? "—").join(" / ")}</td>
                  <td className="px-4 py-3 text-charcoal/60">{fmtDate(l.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-charcoal/40">Changing a stage writes an audit record. Showing up to 100 most recent leads.</p>
    </section>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined}
      className={cn("rounded-full border px-3 py-1.5 text-sm font-medium",
        active ? "border-charcoal bg-charcoal text-white" : "border-charcoal/15 text-charcoal/70 hover:bg-charcoal/5")}>
      {children}
    </Link>
  );
}
