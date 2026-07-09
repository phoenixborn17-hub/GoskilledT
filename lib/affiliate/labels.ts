// Affiliate surface labels (DR-038 / DR-034-035 compliance-safe defaults). Layer-2 copy — kept
// configurable here so a founder rename never needs a code hunt. Defaults per DR-038: the section
// reads "My Network" (the referral relationship), levels stay "Level 1/2/3". No MLM "Team/Downline"
// language (DR-034/DR-035). Leaderboard + Rewards are Phase D — intentionally absent here.
export const AFFILIATE_LABELS = {
  networkSection: "My Network",
  referrals: "Referrals",
  level1: "Level 1",
  level2: "Level 2",
  level3: "Level 3",
  commissionStructure: "Commission structure",
  earningGraph: "Earnings over time",
  networkGraph: "Network growth",
  paymentsGraph: "Payments received",
  walletGraph: "Balance over time",
} as const;

/** "Level 1/2/3" for a numeric level (keeps the DR-038 label wording in one place). */
export function levelLabel(level: 1 | 2 | 3): string {
  return AFFILIATE_LABELS[`level${level}`];
}
