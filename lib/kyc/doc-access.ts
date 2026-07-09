// KYC document access resolution (Phase C §3). Decrypts the stored (encrypted) object path for a
// doc kind. Callers MUST authorize the requester (owner or admin) BEFORE calling the signed-URL
// helper. Returns null when there is no document or the ciphertext can't be decrypted (never leaks).
import { prisma } from "../prisma";
import { decryptPii } from "../pii";
import { KYC_DOC_COLUMN, type KycDocKind } from "../storage/kyc-docs";

export async function resolveKycDocPath(
  userId: string,
  kind: KycDocKind,
): Promise<string | null> {
  const kyc = await prisma.kyc.findUnique({
    where: { userId },
    select: { addressDocEnc: true, panDocEnc: true, bankDocEnc: true },
  });
  const enc = kyc?.[KYC_DOC_COLUMN[kind]];
  if (!enc) return null;
  try {
    return decryptPii(enc);
  } catch {
    return null;
  }
}
