// My Network (Phase B / B2 + B3; Vibrant rollout Slice C — indigo network accent). Server component.
// The 3-level referral tables with date + package filters, plus a network-growth graph (date +
// level filter). Privacy is enforced in the read (lib/affiliate/network.ts) — DR-038 masking is
// BYTE-IDENTICAL: L1 shows first name + masked mobile + packages and is exportable; L2/L3 show
// joined date only and are never exportable. Safe in BOTH flag states (no ₹ here).
import Link from "next/link";
import { Download } from "lucide-react";
import { getCurrentUser } from "../../../../lib/auth/session";
import { prisma } from "../../../../lib/prisma";
import { getReferralNetwork } from "../../../../lib/affiliate/network";
import {
  cumulativeByBucket,
  type Bucket,
} from "../../../../lib/affiliate/analytics";
import { AFFILIATE_LABELS, levelLabel } from "../../../../lib/affiliate/labels";
import { MiniChart } from "../../../../components/affiliate/mini-chart";

export const dynamic = "force-dynamic";

type Range = "30d" | "90d" | "all";
type LevelFilter = "all" | "1" | "2" | "3";

function fromForRange(range: Range, now: Date): Date | undefined {
  if (range === "30d") return new Date(now.getTime() - 30 * 864e5);
  if (range === "90d") return new Date(now.getTime() - 90 * 864e5);
  return undefined;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

function qs(params: Record<string, string>): string {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v && v !== "all"),
  );
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : "";
}

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; pkg?: string; level?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const range: Range =
    sp.range === "30d" || sp.range === "90d" ? sp.range : "all";
  const level: LevelFilter =
    sp.level === "1" || sp.level === "2" || sp.level === "3" ? sp.level : "all";
  const pkg = sp.pkg && sp.pkg !== "all" ? sp.pkg : undefined;
  const now = new Date();
  const from = fromForRange(range, now);

  const [net, packages] = await Promise.all([
    getReferralNetwork(user!.id, { from, packageSlug: pkg }),
    prisma.package.findMany({
      where: { isActive: true },
      select: { slug: true, name: true },
    }),
  ]);

  // Network-growth graph, derived from the SAME filtered rows (consistent with the tables).
  const graphDates = (
    level === "1"
      ? net.l1
      : level === "2"
        ? net.l2
        : level === "3"
          ? net.l3
          : [...net.l1, ...net.l2, ...net.l3]
  ).map((r) => ({ date: r.joinedAt, value: 1 }));
  const bucket: Bucket = range === "all" ? "month" : "day";
  const series = cumulativeByBucket(graphDates, bucket);

  const base = { range, pkg: pkg ?? "all", level };

  return (
    <section aria-labelledby="network-heading" className="gs-vibrant space-y-6">
      <h1
        id="network-heading"
        className="font-heading text-h1 font-bold text-ink"
      >
        {AFFILIATE_LABELS.networkSection}
      </h1>

      {/* Filters — plain links (zero JS). Date range + package + graph level. */}
      <div className="space-y-3">
        <ChipRow label="Period">
          {(["30d", "90d", "all"] as Range[]).map((r) => (
            <Chip
              key={r}
              active={range === r}
              href={`/dashboard/earn/network${qs({ ...base, range: r })}`}
            >
              {r === "all" ? "All time" : r === "30d" ? "30 days" : "90 days"}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow label="Graph level">
          {(["all", "1", "2", "3"] as LevelFilter[]).map((l) => (
            <Chip
              key={l}
              active={level === l}
              href={`/dashboard/earn/network${qs({ ...base, level: l })}`}
            >
              {l === "all" ? "All levels" : levelLabel(Number(l) as 1 | 2 | 3)}
            </Chip>
          ))}
        </ChipRow>
        {packages.length > 0 && (
          <ChipRow label="Package">
            <Chip
              active={!pkg}
              href={`/dashboard/earn/network${qs({ ...base, pkg: "all" })}`}
            >
              All
            </Chip>
            {packages.map((p) => (
              <Chip
                key={p.slug}
                active={pkg === p.slug}
                href={`/dashboard/earn/network${qs({ ...base, pkg: p.slug })}`}
              >
                {p.name}
              </Chip>
            ))}
          </ChipRow>
        )}
      </div>

      {/* Network-growth graph */}
      <div className="vh-card vh-soft vh-accent-network dc-enter space-y-2 p-6">
        <h2 className="font-heading text-h4 font-bold text-ink">
          {AFFILIATE_LABELS.networkGraph}
        </h2>
        <MiniChart
          points={series}
          kind="line"
          format={(n) => `${n} member${n === 1 ? "" : "s"}`}
          empty="No one has joined your network in this period yet."
        />
      </div>

      {/* Level 1 — full rows + export */}
      <div className="vh-card vh-soft vh-accent-network dc-enter space-y-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-h4 font-bold text-ink">
            {levelLabel(1)} · {net.counts.l1}
          </h2>
          {net.counts.l1 > 0 && (
            <Link
              href={`/dashboard/earn/network/export${qs({ ...base, level: "1" })}`}
              className="vh-delta press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-small font-semibold"
              prefetch={false}
            >
              <Download className="h-4 w-4" aria-hidden /> Export CSV
            </Link>
          )}
        </div>
        {net.l1.length === 0 ? (
          <EmptyRow>No direct invites in this period yet.</EmptyRow>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-caption uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Mobile</th>
                  <th className="py-2 pr-3 font-medium">Joined</th>
                  <th className="py-2 font-medium">Packages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {net.l1.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3 font-medium text-ink">
                      {r.firstName || "GoSkilled learner"}
                    </td>
                    <td className="py-2 pr-3 text-ink-muted">
                      {r.mobileMasked ?? "—"}
                    </td>
                    <td className="py-2 pr-3 text-ink-muted">
                      {formatDate(r.joinedAt)}
                    </td>
                    <td className="py-2 text-ink-muted">
                      {r.packages.length ? r.packages.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Level 2 & 3 — joined date only, never exportable (privacy — DR-038 masking untouched) */}
      {([2, 3] as const).map((lvl) => {
        const rows = lvl === 2 ? net.l2 : net.l3;
        const count = lvl === 2 ? net.counts.l2 : net.counts.l3;
        return (
          <div
            key={lvl}
            className="vh-card vh-soft vh-accent-network dc-enter space-y-3 p-6"
          >
            <h2 className="font-heading text-h4 font-bold text-ink">
              {levelLabel(lvl)} · {count}
            </h2>
            {rows.length === 0 ? (
              <EmptyRow>
                No {levelLabel(lvl)} members in this period yet.
              </EmptyRow>
            ) : (
              <ul className="divide-y divide-line/60 text-sm">
                {rows.map((r, i) => (
                  <li key={i} className="flex justify-between gap-3 py-2">
                    <span className="text-ink">GoSkilled learner</span>
                    <span className="text-ink-muted">
                      joined {formatDate(r.joinedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-caption text-ink-muted">
              To protect people you didn&apos;t invite directly,{" "}
              {levelLabel(lvl)} shows join dates only — no names, no mobile
              numbers — and can&apos;t be exported.
            </p>
          </div>
        );
      })}
    </section>
  );
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-caption font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        "press shrink-0 rounded-full px-3 py-1 text-small font-medium transition-colors " +
        (active
          ? "bg-ink text-white"
          : "bg-surface-raised text-ink-muted hover:bg-line")
      }
    >
      {children}
    </Link>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-surface-raised p-4 text-small text-ink-muted">
      {children}
    </p>
  );
}
