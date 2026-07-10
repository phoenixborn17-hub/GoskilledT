// Feature-Visibility resolver (DR-040) — STUB for Phase 2.
// Phase 7 builds the real registry + `isFeatureVisible()` resolver (per user/role/global, server-
// enforced on routes/APIs/actions, with graceful nav recomposition). For now this always returns
// true so nothing is hidden. The nav is already BUILT through this hook (see lib/nav/workspaces),
// so enabling visibility in Phase 7 is a resolver change — the shell recomposes with no gaps.
export type FeatureKey =
  | "home"
  | "learn"
  | "earn" // the Affiliate workspace — the primary DR-040 toggle target
  | "explore"
  | "guru"
  | "account"
  | "share";

// Stub registry — everything visible. Phase 7 replaces this with a per user/role/global resolver.
const VISIBLE = new Set<FeatureKey>([
  "home",
  "learn",
  "earn",
  "explore",
  "guru",
  "account",
  "share",
]);

export function isFeatureVisible(feature: FeatureKey): boolean {
  return VISIBLE.has(feature);
}
