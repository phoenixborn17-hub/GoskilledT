// KYC document access — ADMIN (Phase C §3). Only an admin may fetch another user's KYC document,
// and every access is REVEAL-LOGGED (KYC_DOC_VIEWED, no PII) before a short-lived signed URL is
// issued. Non-admin → 403. Missing → 404.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth/admin";
import { recordAdminAction } from "@/lib/admin/audit";
import { isKycDocKind, kycDocSignedUrl } from "@/lib/storage/kyc-docs";
import { resolveKycDocPath } from "@/lib/kyc/doc-access";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string; kind: string }> },
) {
  const { userId, kind } = await params;
  const admin = await getAdminUser();
  if (!admin) return new NextResponse("Not authorized", { status: 403 });
  if (!isKycDocKind(kind))
    return new NextResponse("Not found", { status: 404 });

  const path = await resolveKycDocPath(userId, kind);
  if (!path) return new NextResponse("No document", { status: 404 });

  // Reveal-log the access (audit row carries NO PII — just that this admin viewed this doc kind).
  await prisma.$transaction((tx) =>
    recordAdminAction(tx, {
      actor: admin,
      action: "KYC_DOC_VIEWED",
      entity: "Kyc",
      entityId: userId,
      meta: { kind },
    }),
  );

  const url = await kycDocSignedUrl(path, 60);
  return NextResponse.redirect(url);
}
