// Runtime launch-gate signals (GPS-M4). Encodes the LAUNCH_CONFIG discipline the app needs to read
// at runtime — kept tiny and explicit so it never drifts from docs/LAUNCH_CONFIG.md.
//
// LC #1 (D-01 affiliate-programme legality) is the precondition for the payout-flag ceremony
// (§1/§1B). It is PENDING until counsel clears it; the founder then sets D01_LEGAL_CLEARED=true.
// This gate ONLY controls whether the flip UI may enable payouts — the money source of truth stays
// `AFFILIATE_PAYOUTS_ENABLED` (lib/env#payoutsEnabled), a single legal kill-switch.

/** True once D-01 legal clearance (LC #1) is recorded. Default false (PENDING). */
export function lcOneFinal(): boolean {
  return process.env.D01_LEGAL_CLEARED === "true";
}
