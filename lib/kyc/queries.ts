// KYC read adapter (GPS-M3 §2.4). Decrypts server-side ONLY to mask (PAN/account → last-4) or to
// show the user their own holder name. PII never leaves the server un-masked; never logged.
//
// SCHEMA NOTE (LC #32, resolved in GPS-M4): the account-holder name now lives in its own
// `accountHolderEnc` column (migrated from the former `bankNameEnc`). Bank name is derivable from
// IFSC and not payout-critical, so no separate column exists for it.
import { prisma } from "../prisma";
import { decryptPii, maskLast4 } from "../pii";
import { kycUiStatus, type KycUiStatus } from "../../modules/kyc/kyc";

export interface KycView {
  uiStatus: KycUiStatus;
  panMasked: string | null;
  accountMasked: string | null;
  ifsc: string | null; // bank branch code — not secret PII, stored plaintext
  holderName: string | null;
  submittedAt: Date | null;
}

export async function getKycView(userId: string): Promise<KycView> {
  const kyc = await prisma.kyc.findUnique({
    where: { userId },
    select: {
      panEnc: true,
      accountNoEnc: true,
      accountHolderEnc: true,
      ifsc: true,
      status: true,
      submittedAt: true,
    },
  });

  if (!kyc) {
    return {
      uiStatus: "NOT_SUBMITTED",
      panMasked: null,
      accountMasked: null,
      ifsc: null,
      holderName: null,
      submittedAt: null,
    };
  }

  return {
    uiStatus: kycUiStatus(kyc.status),
    panMasked: kyc.panEnc ? maskLast4(decryptPii(kyc.panEnc)) : null,
    accountMasked: kyc.accountNoEnc
      ? maskLast4(decryptPii(kyc.accountNoEnc))
      : null,
    ifsc: kyc.ifsc,
    holderName: kyc.accountHolderEnc ? decryptPii(kyc.accountHolderEnc) : null,
    submittedAt: kyc.submittedAt,
  };
}

/** Server-only: the KYC status for gating (withdrawal validation). No PII. */
export async function getKycStatus(
  userId: string,
): Promise<"DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | null> {
  const kyc = await prisma.kyc.findUnique({
    where: { userId },
    select: { status: true },
  });
  return kyc?.status ?? null;
}
