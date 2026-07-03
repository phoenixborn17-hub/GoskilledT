// KYC read adapter (GPS-M3 §2.4). Decrypts server-side ONLY to mask (PAN/account → last-4) or to
// show the user their own holder name. PII never leaves the server un-masked; never logged.
//
// SCHEMA NOTE (flagged for Fable / GPS-M4): the `Kyc` model has `bankNameEnc` but no dedicated
// account-holder-name column. The spec's KYC inputs are PAN + account no + IFSC + account-HOLDER
// name (bank name is derivable from IFSC and not payout-critical). To avoid a schema migration on
// the shared DB from a parked branch, the account-holder name is stored (encrypted) in
// `bankNameEnc`. A future migration may add `accountHolderEnc`; the UX/contract is unchanged.
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
      bankNameEnc: true,
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
    holderName: kyc.bankNameEnc ? decryptPii(kyc.bankNameEnc) : null,
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
