// Pure KYC field validation (GPS-M3 §2.4). No DB, no framework — the single source of truth for
// what a valid PAN / IFSC / account number looks like. Adapters (the server action's Zod schema)
// call these; UI never re-derives them.

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/; // e.g. ABCDE1234F
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/; // e.g. SBIN0001234
export const ACCOUNT_REGEX = /^[0-9]{9,18}$/; // Indian bank account numbers

export function isValidPan(v: string): boolean {
  return PAN_REGEX.test(v.trim().toUpperCase());
}
export function isValidIfsc(v: string): boolean {
  return IFSC_REGEX.test(v.trim().toUpperCase());
}
export function isValidAccountNumber(v: string): boolean {
  return ACCOUNT_REGEX.test(v.trim());
}

/** KYC status → the four UI states (GPS-M3 §2.4). Maps the Prisma KycStatus enum. */
export type KycUiStatus =
  "NOT_SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";

export function kycUiStatus(
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | null | undefined,
): KycUiStatus {
  switch (status) {
    case "SUBMITTED":
      return "UNDER_REVIEW";
    case "APPROVED":
      return "VERIFIED";
    case "REJECTED":
      return "REJECTED";
    default:
      return "NOT_SUBMITTED"; // DRAFT or no row
  }
}
