// Address-proof document types (Phase C §3 · LAUNCH_CONFIG copy — open point §7). Placeholder list;
// the founder confirms the final options. Values are stored verbatim in Kyc.docType.
export const KYC_DOC_TYPES = [
  "Aadhaar card",
  "Driving licence",
  "Voter ID",
  "Passport",
] as const;

export function isKycDocType(v: string): boolean {
  return (KYC_DOC_TYPES as readonly string[]).includes(v.trim());
}
