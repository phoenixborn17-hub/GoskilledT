// Feature Visibility System (DR-040) — the PURE resolver.
//
// Given a feature's scope overrides + a user context, decide visible/hidden. No DB, no framework —
// so the precedence + fail-safe rules are node-testable in isolation. The DB load + per-request
// memoisation live in ./context.ts; enforcement (route guards, action guards, nav) consumes this.

import { FEATURES, type FeatureKey } from "./registry";

export type FeatureScope = "GLOBAL" | "ROLE" | "USER";

export interface FeatureOverrideRow {
  featureKey: string;
  scope: FeatureScope;
  /** "" for GLOBAL; the role string for ROLE; the userId for USER. */
  scopeValue: string;
  visible: boolean;
}

export interface UserContext {
  /** Internal User.id, or null for an anonymous/public visitor (only GLOBAL overrides apply). */
  userId: string | null;
  /** User.role (USER · ADMIN · REVIEWER), or null when anonymous. */
  role: string | null;
}

/** Is this override applicable to the given context? */
function applies(row: FeatureOverrideRow, ctx: UserContext): boolean {
  switch (row.scope) {
    case "GLOBAL":
      return true;
    case "ROLE":
      return ctx.role != null && row.scopeValue === ctx.role;
    case "USER":
      return ctx.userId != null && row.scopeValue === ctx.userId;
    default:
      return false;
  }
}

/**
 * Resolve ONE feature. Precedence is **hide-wins / fail-safe** (per spec §Configurability): if ANY
 * applicable scope (global/role/user) says HIDE → hidden; else if any says SHOW → visible; else the
 * registry default. Hide-wins is deliberate — a global review-window hide can't be accidentally
 * re-revealed by a stale per-user flag, and revealing is always the explicit act of removing the hide.
 * Unknown keys and no-applicable-override → registry default (or false if the key is unknown).
 */
export function resolveFeature(
  featureKey: FeatureKey,
  overrides: FeatureOverrideRow[],
  ctx: UserContext,
): boolean {
  const def = FEATURES[featureKey];
  const applicable = overrides.filter(
    (o) => o.featureKey === featureKey && applies(o, ctx),
  );
  if (applicable.some((o) => o.visible === false)) return false; // hide wins
  if (applicable.some((o) => o.visible === true)) return true;
  return def ? def.defaultVisible : false;
}

/** Resolve every registered feature into a plain map, applying the overrides for this context. */
export function resolveAllFeatures(
  overrides: FeatureOverrideRow[],
  ctx: UserContext,
): Record<FeatureKey, boolean> {
  const out = {} as Record<FeatureKey, boolean>;
  for (const key of Object.keys(FEATURES) as FeatureKey[]) {
    let visible = resolveFeature(key, overrides, ctx);
    // `share` (the referral affordance) is not independently managed — it follows the affiliate flag.
    if (key === "share") visible = resolveFeature("earn", overrides, ctx);
    out[key] = visible;
  }
  return out;
}
