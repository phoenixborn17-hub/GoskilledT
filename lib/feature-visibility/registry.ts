// Feature Visibility System (DR-040) — the feature REGISTRY.
//
// A general, extensible feature-flag system: ANY module/workspace (Affiliate, AI, Marketplace,
// Communities, Jobs, …) registers a key here with a default and a fail-safe, and is then toggleable
// per-user / per-role / globally through the SAME resolver + admin UI. This file is the code-level
// source of truth for WHICH features exist and their defaults; per-scope OVERRIDES live in the
// `FeatureOverride` table and are applied by the resolver.
//
// COMPLIANCE REFRAME (DR-040): the affiliate flag is a LEGAL LAUNCH-GATE / staged rollout (the
// affiliate model is disabled until its legal review clears, then enabled) — NOT reviewer "cloaking".
// The flag gates the actually-regulated surfaces first (share/referral link · referral attribution
// display · the Earn routes), and the nav recomposes as a by-product.

export type FeatureKey =
  | "home"
  | "learn"
  | "earn" // the Affiliate/Earn layer — the primary DR-040 toggle target
  | "explore"
  | "guru"
  | "account"
  | "share"
  | "marketplace"; // reserved/dummy — proves the system is general (a 2nd toggleable feature)

export interface FeatureDef {
  key: FeatureKey;
  label: string;
  description: string;
  /** Value when no scope override applies. */
  defaultVisible: boolean;
  /** On resolver error / ambiguity, fall to the MORE-HIDDEN state (safer for a review). */
  failSafeHidden: boolean;
  /** Surfaced in the admin flag UI (structural features like Home/Account are never toggled). */
  adminControllable: boolean;
}

// Structural workspaces (home/learn/account) are always visible and NOT admin-controllable — the app
// is never a blank shell. `earn` is the affiliate layer (the DR-040 target). `marketplace` is a
// reserved dummy that ships HIDDEN and toggleable, so the system's generality is provable end-to-end.
export const FEATURES: Record<FeatureKey, FeatureDef> = {
  home: {
    key: "home",
    label: "Home",
    description: "The Home hub — always available.",
    defaultVisible: true,
    failSafeHidden: false,
    adminControllable: false,
  },
  learn: {
    key: "learn",
    label: "Learn",
    description: "The Learning workspace — always available.",
    defaultVisible: true,
    failSafeHidden: false,
    adminControllable: false,
  },
  account: {
    key: "account",
    label: "Account",
    description: "The Account workspace — always available.",
    defaultVisible: true,
    failSafeHidden: false,
    adminControllable: false,
  },
  earn: {
    key: "earn",
    label: "Affiliate (Earn)",
    description:
      "The Affiliate/Earn layer: Earn workspace, referral share links, network, wallet, commissions, leaderboard, rewards, KYC-for-payout. DR-040 legal launch-gate — disable until affiliate legal review clears.",
    // Default preserves current product behaviour (Earn is live). Flip the GLOBAL override to hidden
    // for a review window or until D-01 legal clears (a LAUNCH_CONFIG decision, not a code default).
    defaultVisible: true,
    failSafeHidden: true, // any error/ambiguity → hidden (compliance-safe)
    adminControllable: true,
  },
  marketplace: {
    key: "marketplace",
    label: "Marketplace (reserved)",
    description:
      "Reserved future workspace. Ships hidden; toggleable — demonstrates the visibility system is general, not an affiliate one-off.",
    defaultVisible: false,
    failSafeHidden: true,
    adminControllable: true,
  },
  // Legacy/structural keys kept for type-compatibility with the nav model. Not managed by this UI:
  // `share` visibility DERIVES from `earn` (see resolver); `explore`/`guru` are governed elsewhere
  // (Explore folded into Learn; Guru behind lib/flags.guruEnabled()).
  share: {
    key: "share",
    label: "Referral share",
    description:
      "Referral share affordance — follows the Affiliate (earn) flag.",
    defaultVisible: true,
    failSafeHidden: true,
    adminControllable: false,
  },
  explore: {
    key: "explore",
    label: "Explore",
    description:
      "Folded into Learn (Browse) — not a standalone workspace in V1.",
    defaultVisible: true,
    failSafeHidden: false,
    adminControllable: false,
  },
  guru: {
    key: "guru",
    label: "Guru AI",
    description: "Deferred (DR-041); governed by lib/flags.guruEnabled().",
    defaultVisible: false,
    failSafeHidden: false,
    adminControllable: false,
  },
};

/** Admin-toggleable features, in display order (Affiliate first). */
export const CONTROLLABLE_FEATURES: FeatureDef[] = (
  Object.values(FEATURES) as FeatureDef[]
).filter((f) => f.adminControllable);

export function isKnownFeature(key: string): key is FeatureKey {
  return Object.prototype.hasOwnProperty.call(FEATURES, key);
}
