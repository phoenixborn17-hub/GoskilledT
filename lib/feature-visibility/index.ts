// Feature Visibility System (DR-040) — CLIENT-SAFE public surface.
//
// This barrel re-exports only pure, isomorphic pieces (registry + resolver types/logic) so client
// components (e.g. the nav shell) can import types + a pure map helper without pulling in server-only
// code. The SERVER enforcement helpers (getVisibleFeatures / isFeatureVisible / assertFeatureVisible)
// live in ./context and must be imported from there directly (they are `server-only`).
export {
  FEATURES,
  CONTROLLABLE_FEATURES,
  isKnownFeature,
  type FeatureKey,
  type FeatureDef,
} from "./registry";

export {
  resolveFeature,
  resolveAllFeatures,
  type FeatureScope,
  type FeatureOverrideRow,
  type UserContext,
} from "./resolver";

import type { FeatureKey } from "./registry";

/**
 * Client-side read of a server-resolved visibility map (passed down as a prop). This is presentation
 * polish ON TOP OF server enforcement — never the only gate. Missing key → treated as hidden.
 */
export function isVisibleIn(
  map: Partial<Record<FeatureKey, boolean>> | undefined,
  key: FeatureKey,
): boolean {
  return map?.[key] === true;
}
