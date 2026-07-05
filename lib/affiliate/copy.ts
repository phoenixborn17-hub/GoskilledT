// Affiliate copy slots — LAUNCH_CONFIG #17 (pre-D-01 copy set). Placeholder = current compliant
// copy. D-29 floor (not configurable): no income language, no numbers, no "potential earnings".
// When the programme is approved, this copy set is finalised via LC #17 (flag flip = LC #18).
export const AFFILIATE_COPY = {
  // Pre-flag Earn hub
  inviteHeading: "Invite friends who want to learn",
  inviteBody:
    "Our referral programme is being finalised and will open after review. Share your link now — friends you invite stay linked to you, so you're set for when it opens.",
  shareCta: "Share your link",
  copyCta: "Copy link",
  copied: "Copied ✓",
  inviteZero: "0 invites yet — share your link to get started.",
  // Referral MILESTONES (§2.6 signature moment) — community/count framing ONLY. D-29 floor:
  // no income, no rewards, no ₹. These celebrate the act of inviting learners, never earnings.
  milestoneReached: "Milestone reached — shabaash! 🎉",
  milestoneStart: "Pehla invite se milestone journey shuru hoti hai.",
  // Neutral pending note shown on money surfaces while the flag is OFF. Zero earnings language
  // (§1C is stricter than the D-29 floor here): no "earnings", "rewards", "₹", or "credited".
  moneyPendingHeading: "Opens after review",
  moneyPendingBody:
    "This section will be ready when the referral programme opens. Everything you invite now stays linked to you — you lose nothing by starting today.",
  // WhatsApp share message (no income claims).
  shareMessage:
    "I'm learning practical skills on GoSkilled — join with my link and start with a free preview:",
} as const;
