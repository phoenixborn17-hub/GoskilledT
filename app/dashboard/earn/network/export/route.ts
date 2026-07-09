// L1 referral export (Phase B / B3). ONLY Level 1 is exportable — L2/L3 are refused server-side
// (DR-038 privacy). Authorized to the signed-in user, scoped to THEIR own network, rate-limited.
// Mirrors the admin audit-export route pattern.
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth/session";
import { getL1Export, l1ToCsv } from "../../../../../lib/affiliate/network";
import { rateLimit } from "../../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Not authorized", { status: 401 });

  const sp = request.nextUrl.searchParams;
  // DR-038: only Level 1 may be exported. Any other level is refused HERE, server-side — the UI
  // never offers an L2/L3 export, and this is the enforcing backstop.
  const level = sp.get("level") ?? "1";
  if (level !== "1")
    return new NextResponse("Only Level 1 is exportable.", { status: 403 });

  // Per-user rate-limit — an export reads real mobile numbers; keep it modest.
  const rl = rateLimit(`network-export:${user.id}`, {
    windowMs: 10 * 60 * 1000,
    max: 5,
  });
  if (!rl.ok)
    return new NextResponse("Too many exports. Please try again shortly.", {
      status: 429,
    });

  const range = sp.get("range");
  const from =
    range === "30d"
      ? new Date(Date.now() - 30 * 864e5)
      : range === "90d"
        ? new Date(Date.now() - 90 * 864e5)
        : undefined;
  const pkgParam = sp.get("pkg");
  const packageSlug = pkgParam && pkgParam !== "all" ? pkgParam : undefined;

  const rows = await getL1Export(user.id, { from, packageSlug });
  const csv = l1ToCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="my-network-level-1.csv"',
      "Cache-Control": "no-store",
    },
  });
}
