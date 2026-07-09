// My-Network detail read (Phase B / B3, privacy-critical · DR-038). Walks the real referral graph
// (`User.referredById`, same source as the commission engine — the `Referral` table is unpopulated,
// see lib/affiliate/referrals.ts). PRIVACY IS ENFORCED AT THE QUERY LAYER, not the component:
//   • Level 1 (your direct invites): first name + joined date + masked mobile + packages. Exportable.
//   • Level 2 & 3: joined date ONLY — the `select` NEVER reads name or phone, so those fields cannot
//     leak to the client, and the row type carries no phone field. NON-exportable (see the route).
// Full mobile is read ONLY for the L1 server-side export (never sent to the browser).
import { prisma } from "../prisma";
import { maskLast4 } from "../pii";

export interface NetworkFilters {
  from?: Date; // filter on the downline's joined date (inclusive)
  to?: Date;
  packageSlug?: string; // keep only downlines with a PAID order for this package
}

export interface L1Row {
  firstName: string | null;
  joinedAt: Date;
  mobileMasked: string | null; // "•••• 1234" — full number never leaves the server for the UI
  packages: string[]; // names of packages this downline has PAID for
}

/** L2/L3 row — deliberately carries NO name and NO phone (privacy by construction). */
export interface MaskedRow {
  joinedAt: Date;
}

export interface ReferralNetwork {
  l1: L1Row[];
  l2: MaskedRow[];
  l3: MaskedRow[];
  counts: { l1: number; l2: number; l3: number };
}

/** Full L1 row for the SERVER-SIDE export only (includes the real mobile). Never returned to a page. */
export interface L1ExportRow {
  name: string | null;
  mobile: string | null;
  joinedAt: Date;
  packages: string[];
}

type Ided = { id: string; createdAt: Date };

function inRange(d: Date, from?: Date, to?: Date): boolean {
  return (!from || d >= from) && (!to || d <= to);
}

/** userId → { names, slugs } of the user's PAID-order packages (one batched query). */
async function paidPackagesByUser(
  userIds: string[],
): Promise<Map<string, { names: string[]; slugs: Set<string> }>> {
  const map = new Map<string, { names: string[]; slugs: Set<string> }>();
  if (userIds.length === 0) return map;
  const orders = await prisma.order.findMany({
    where: { userId: { in: userIds }, status: "PAID" },
    select: { userId: true, package: { select: { slug: true, name: true } } },
  });
  for (const o of orders) {
    const cur = map.get(o.userId) ?? { names: [], slugs: new Set<string>() };
    if (!cur.slugs.has(o.package.slug)) {
      cur.slugs.add(o.package.slug);
      cur.names.push(o.package.name);
    }
    map.set(o.userId, cur);
  }
  return map;
}

function passesFilters(
  row: Ided,
  pkg: Map<string, { names: string[]; slugs: Set<string> }>,
  f: NetworkFilters,
): boolean {
  if (!inRange(row.createdAt, f.from, f.to)) return false;
  if (f.packageSlug && !pkg.get(row.id)?.slugs.has(f.packageSlug)) return false;
  return true;
}

/** Fetch the three levels of ids (createdAt only for L2/L3 — no name/phone ever selected). */
async function fetchLevels(userId: string): Promise<{
  l1: {
    id: string;
    name: string | null;
    phone: string | null;
    createdAt: Date;
  }[];
  l2: Ided[];
  l3: Ided[];
}> {
  const l1 = await prisma.user.findMany({
    where: { referredById: userId },
    select: { id: true, name: true, phone: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const l1Ids = l1.map((u) => u.id);
  const l2 = l1Ids.length
    ? await prisma.user.findMany({
        where: { referredById: { in: l1Ids } },
        select: { id: true, createdAt: true }, // NO name, NO phone — privacy by construction
        orderBy: { createdAt: "desc" },
      })
    : [];
  const l2Ids = l2.map((u) => u.id);
  const l3 = l2Ids.length
    ? await prisma.user.findMany({
        where: { referredById: { in: l2Ids } },
        select: { id: true, createdAt: true }, // NO name, NO phone
        orderBy: { createdAt: "desc" },
      })
    : [];
  return { l1, l2, l3 };
}

/** The masked network for the page. L1 = first name + masked mobile; L2/L3 = joined date only. */
export async function getReferralNetwork(
  userId: string,
  filters: NetworkFilters = {},
): Promise<ReferralNetwork> {
  const { l1, l2, l3 } = await fetchLevels(userId);
  const pkg = await paidPackagesByUser([
    ...l1.map((u) => u.id),
    ...l2.map((u) => u.id),
    ...l3.map((u) => u.id),
  ]);

  const l1Rows: L1Row[] = l1
    .filter((u) => passesFilters(u, pkg, filters))
    .map((u) => ({
      firstName: u.name?.trim().split(/\s+/)[0] || null,
      joinedAt: u.createdAt,
      mobileMasked: u.phone ? maskLast4(u.phone) : null,
      packages: pkg.get(u.id)?.names ?? [],
    }));
  const l2Rows: MaskedRow[] = l2
    .filter((u) => passesFilters(u, pkg, filters))
    .map((u) => ({ joinedAt: u.createdAt }));
  const l3Rows: MaskedRow[] = l3
    .filter((u) => passesFilters(u, pkg, filters))
    .map((u) => ({ joinedAt: u.createdAt }));

  return {
    l1: l1Rows,
    l2: l2Rows,
    l3: l3Rows,
    counts: { l1: l1Rows.length, l2: l2Rows.length, l3: l3Rows.length },
  };
}

/** SERVER-ONLY: full Level-1 rows (real mobile) for the export route. Only L1 is ever exportable. */
export async function getL1Export(
  userId: string,
  filters: NetworkFilters = {},
): Promise<L1ExportRow[]> {
  const l1 = await prisma.user.findMany({
    where: { referredById: userId },
    select: { id: true, name: true, phone: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const pkg = await paidPackagesByUser(l1.map((u) => u.id));
  return l1
    .filter((u) => passesFilters(u, pkg, filters))
    .map((u) => ({
      name: u.name ?? null,
      mobile: u.phone ?? null,
      joinedAt: u.createdAt,
      packages: pkg.get(u.id)?.names ?? [],
    }));
}

function csvCell(v: string): string {
  // Quote if the value contains a comma, quote, or newline; double embedded quotes.
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** CSV for the L1 export (server-generated). Columns: Name, Mobile, Joined, Packages. */
export function l1ToCsv(rows: L1ExportRow[]): string {
  const header = ["Name", "Mobile", "Joined (IST)", "Packages"];
  const body = rows.map((r) =>
    [
      csvCell(r.name ?? ""),
      csvCell(r.mobile ?? ""),
      csvCell(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
        }).format(r.joinedAt),
      ),
      csvCell(r.packages.join("; ")),
    ].join(","),
  );
  return [header.join(","), ...body].join("\n");
}
