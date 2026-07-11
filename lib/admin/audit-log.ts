// Audit-log adapter (GPS-M4 §2.7 — Tier B, read-only). The append-only accountability trail. Rows
// are never mutated or deleted here; meta carries NO PII (writers already exclude it). Filterable +
// paginated; CSV export for offline review.
import { prisma } from "../prisma";

const PAGE_SIZE = 50;

export interface AuditFilter {
  action?: string;
  entity?: string;
  page?: number;
}

export interface AuditRow {
  id: string;
  actorEmail: string | null;
  actorSupabaseId: string;
  action: string;
  entity: string;
  entityId: string | null;
  meta: unknown;
  createdAt: Date;
}

export async function listAuditLog(filter: AuditFilter = {}) {
  const page = Math.max(1, filter.page ?? 1);
  const where = {
    ...(filter.action ? { action: filter.action } : {}),
    ...(filter.entity ? { entity: filter.entity } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.adminAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.adminAction.count({ where }),
  ]);
  return {
    rows: rows as AuditRow[],
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/** Distinct action + entity values present in the log — for the filter dropdowns. */
export async function auditFacets() {
  const [actions, entities] = await Promise.all([
    prisma.adminAction.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
    prisma.adminAction.findMany({
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
    }),
  ]);
  return {
    actions: actions.map((a) => a.action),
    entities: entities.map((e) => e.entity),
  };
}

/** Recent trail for the dashboard (last N). */
export async function recentAudit(limit = 10): Promise<AuditRow[]> {
  const rows = await prisma.adminAction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows as AuditRow[];
}

function csvCell(v: string): string {
  // A-3: neutralise CSV formula injection (Excel/Sheets execute cells starting with = + - @ / tab / CR).
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Serialize audit rows to CSV (no PII — meta is JSON-stringified as-is). */
export function auditToCsv(rows: AuditRow[]): string {
  const header = [
    "createdAt",
    "actorEmail",
    "action",
    "entity",
    "entityId",
    "meta",
  ];
  const lines = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      r.actorEmail ?? "",
      r.action,
      r.entity,
      r.entityId ?? "",
      r.meta ? JSON.stringify(r.meta) : "",
    ]
      .map((c) => csvCell(String(c)))
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
