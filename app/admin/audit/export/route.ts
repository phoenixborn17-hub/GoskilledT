// /admin/audit/export — CSV export of the audit log (GPS-M4 §2.7). RBAC re-checked server-side.
// No PII (meta is written PII-free). Honors the same action/entity filters as the page. Capped.
import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "../../../../lib/auth/admin";
import { listAuditLog, auditToCsv } from "../../../../lib/admin/audit-log";

export const dynamic = "force-dynamic";
const MAX_ROWS = 5000;
const PAGE = 50; // matches listAuditLog page size

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin)
    return new NextResponse("Not authorized", { status: 403 });

  const sp = request.nextUrl.searchParams;
  const action = sp.get("action") ?? undefined;
  const entity = sp.get("entity") ?? undefined;

  // Page through up to MAX_ROWS newest-first.
  const rows = [];
  for (let page = 1; rows.length < MAX_ROWS; page++) {
    const res = await listAuditLog({ action, entity, page });
    rows.push(...res.rows);
    if (page >= res.pageCount || res.rows.length < PAGE) break;
  }

  const csv = auditToCsv(rows.slice(0, MAX_ROWS));
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="audit-log.csv"',
      "Cache-Control": "no-store",
    },
  });
}
