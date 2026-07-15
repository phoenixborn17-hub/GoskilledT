// Referral click sink (Feature Batch v1.0 §3). Called server-to-server from middleware.ts (Edge
// runtime can't reach Postgres directly) via a non-blocking `event.waitUntil()` fetch — this route
// runs on the default Node.js runtime where Prisma works. Thin adapter: Zod-validates the boundary,
// rate-limits by IP (never persisted), then delegates to the domain function. No auth required —
// this fires for anonymous, pre-signup visitors by design.
import { NextResponse } from "next/server";
import { z } from "zod";
import { logReferralClick } from "../../../../lib/affiliate/referral-click";
import { evaluateReferralClickRate } from "../../../../lib/affiliate/referral-click-rate";
import { clientIp } from "../../../../lib/auth/otp-rate-limit";
import { sanitizeRefCode } from "../../../../lib/auth/ref-cookie";
import { isValidVisitorId } from "../../../../lib/auth/visitor-cookie";

const BodySchema = z.object({
  code: z.string().min(1),
  visitorId: z.string().min(1),
});

export async function POST(request: Request) {
  const ip = await clientIp();
  if (!evaluateReferralClickRate(ip).ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const code = sanitizeRefCode(parsed.data.code);
  const visitorId = parsed.data.visitorId;
  if (!code || !isValidVisitorId(visitorId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const result = await logReferralClick(code, visitorId);
  return NextResponse.json({ ok: true, logged: result.logged });
}
