// DR-038 earning gate (pure rule). A referral link or a free registration ALONE never earns:
// an affiliate earns commission on a downline's purchase ONLY if the affiliate has made their
// OWN confirmed purchase. This module states the rule as a pure, unit-testable predicate; the
// DB-backed input (`hasConfirmedPurchase`) is supplied by the adapter in lib/affiliate/eligibility.ts.
//
// Phase A scope: the rule is LOCKED + unit-tested here and wired as a DOCUMENTED HOOK at the
// commission-credit site (lib/payments/webhook.ts → CREDIT_COMMISSIONS). FULL enforcement — filtering
// ineligible uplines out of the live credit — is Phase B, so the DR-023 money path is unchanged now.

export interface EarningEligibilityInput {
  /** Does this affiliate have ≥1 of their OWN confirmed (paid) purchases? */
  hasOwnConfirmedPurchase: boolean;
}

/** DR-038: an affiliate may earn commission on a downline purchase iff they've purchased themselves. */
export function canEarnCommission(input: EarningEligibilityInput): boolean {
  return input.hasOwnConfirmedPurchase;
}
