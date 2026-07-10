// KYC document access — OWNER self-serve (Phase C §3). Serves ONLY the signed-in user's own document
// via a short-lived signed URL to the private bucket. No `userId` param exists here, so a user can
// never reach another person's file. Unauthenticated → 401; missing → 404. Direct bucket access
// without a signed URL is denied by Supabase (private bucket).
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  isKycDocKind,
  kycDocSignedUrl,
  canAccessKycDoc,
} from "@/lib/storage/kyc-docs";
import { resolveKycDocPath } from "@/lib/kyc/doc-access";
import { checkActionRate } from "@/lib/auth/action-rate-limit";
import { isFeatureVisible } from "@/lib/feature-visibility/context";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params;
  if (!isKycDocKind(kind))
    return new NextResponse("Not found", { status: 404 });

  const user = await getCurrentUser();
  if (!user) return new NextResponse("Not authorized", { status: 401 });

  // DR-040: KYC-for-payout is part of the Affiliate layer — unreachable (404) when hidden.
  if (!(await isFeatureVisible("earn")))
    return new NextResponse("Not found", { status: 404 });

  // Abuse throttle (Unit 3) — a document fetch reads decrypted-path → signed URL; cap per user.
  const rl = await checkActionRate("kyc-doc", user.id, 30);
  if (!rl.ok) return new NextResponse(rl.error, { status: 429 });

  // Owner-only route (self). The rule is still evaluated explicitly for defence in depth.
  if (
    !canAccessKycDoc({ requesterId: user.id, ownerId: user.id, isAdmin: false })
  )
    return new NextResponse("Forbidden", { status: 403 });

  const path = await resolveKycDocPath(user.id, kind);
  if (!path) return new NextResponse("No document", { status: 404 });

  const url = await kycDocSignedUrl(path, 60);
  return NextResponse.redirect(url);
}
