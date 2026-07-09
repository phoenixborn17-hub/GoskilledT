// DR-038 earning gate (pure rule). A referral link or a free registration ALONE never earns:
// an affiliate earns commission on a downline's purchase ONLY if the affiliate has made their
// OWN confirmed purchase. This module states the rule as a pure, unit-testable predicate; the
// DB-backed input (`hasConfirmedPurchase`) is supplied by the adapter in lib/affiliate/eligibility.ts.
//
// Phase A locked + unit-tested this rule; Phase B (B1) ACTIVATED it at the commission-credit site
// (lib/payments/webhook.ts → CREDIT_COMMISSIONS): each resolved upline is credited only if this
// predicate holds for their own confirmed purchase, evaluated inside the crediting transaction.
// Ineligible uplines are skipped with NO roll-up (each surviving hop keeps its original level).

export interface EarningEligibilityInput {
  /** Does this affiliate have ≥1 of their OWN confirmed (paid) purchases? */
  hasOwnConfirmedPurchase: boolean;
}

/** DR-038: an affiliate may earn commission on a downline purchase iff they've purchased themselves. */
export function canEarnCommission(input: EarningEligibilityInput): boolean {
  return input.hasOwnConfirmedPurchase;
}
