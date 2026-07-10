// Feature Visibility admin adapter (DR-040 · Tier A — compliance). Reads the current overrides for
// every admin-controllable feature, and applies set/clear at global/role/user scope. Every change is
// audited via the immutable AdminAction log, atomically with the write (same pattern as the KYC /
// payout-flag adapters). NO money logic — visibility of surfaces only.
import { prisma } from "../prisma";
import type { AdminIdentity } from "../auth/admin";
import { recordAdminAction } from "./audit";
import {
  CONTROLLABLE_FEATURES,
  isKnownFeature,
  type FeatureKey,
  type FeatureScope,
} from "../feature-visibility";

export interface ScopedOverride {
  scope: FeatureScope;
  scopeValue: string;
  visible: boolean;
}

export interface FeatureFlagView {
  key: FeatureKey;
  label: string;
  description: string;
  defaultVisible: boolean;
  /** The GLOBAL override's value, or null when no global override exists (→ default applies). */
  globalOverride: boolean | null;
  roleOverrides: { scopeValue: string; visible: boolean }[];
  userOverrides: { scopeValue: string; visible: boolean }[];
}

export type FlagResult = { ok: true } | { ok: false; error: string };

/** Every admin-controllable feature + its current overrides, grouped by scope. */
export async function listFeatureFlags(): Promise<FeatureFlagView[]> {
  const rows = await prisma.featureOverride.findMany({
    orderBy: [{ featureKey: "asc" }, { scope: "asc" }, { scopeValue: "asc" }],
  });
  return CONTROLLABLE_FEATURES.map((f) => {
    const forKey = rows.filter((r) => r.featureKey === f.key);
    const global = forKey.find((r) => r.scope === "GLOBAL");
    return {
      key: f.key,
      label: f.label,
      description: f.description,
      defaultVisible: f.defaultVisible,
      globalOverride: global ? global.visible : null,
      roleOverrides: forKey
        .filter((r) => r.scope === "ROLE")
        .map((r) => ({ scopeValue: r.scopeValue, visible: r.visible })),
      userOverrides: forKey
        .filter((r) => r.scope === "USER")
        .map((r) => ({ scopeValue: r.scopeValue, visible: r.visible })),
    };
  });
}

function normalizeScopeValue(scope: FeatureScope, raw: string): string {
  return scope === "GLOBAL" ? "" : raw.trim();
}

/** Upsert one override at (feature, scope, scopeValue) + record an immutable audit row atomically. */
export async function setFeatureOverride(
  actor: AdminIdentity,
  input: {
    featureKey: string;
    scope: FeatureScope;
    scopeValue: string;
    visible: boolean;
  },
): Promise<FlagResult> {
  if (!isKnownFeature(input.featureKey))
    return { ok: false, error: "Unknown feature." };
  if (!CONTROLLABLE_FEATURES.some((f) => f.key === input.featureKey))
    return { ok: false, error: "This feature is not toggleable." };

  const scopeValue = normalizeScopeValue(input.scope, input.scopeValue);
  if (input.scope !== "GLOBAL" && !scopeValue)
    return {
      ok: false,
      error:
        input.scope === "ROLE"
          ? "Enter a role (e.g. REVIEWER)."
          : "Enter a user id.",
    };

  await prisma.$transaction(async (tx) => {
    await tx.featureOverride.upsert({
      where: {
        featureKey_scope_scopeValue: {
          featureKey: input.featureKey,
          scope: input.scope,
          scopeValue,
        },
      },
      create: {
        featureKey: input.featureKey,
        scope: input.scope,
        scopeValue,
        visible: input.visible,
        updatedBy: actor.supabaseId,
      },
      update: { visible: input.visible, updatedBy: actor.supabaseId },
    });
    await recordAdminAction(tx, {
      actor,
      action: "FEATURE_VISIBILITY_SET",
      entity: "FeatureOverride",
      entityId: input.featureKey,
      meta: { scope: input.scope, scopeValue, visible: input.visible },
    });
  });
  return { ok: true };
}

/** Remove an override (revert that scope to the next-lower precedence / default) + audit it. */
export async function clearFeatureOverride(
  actor: AdminIdentity,
  input: { featureKey: string; scope: FeatureScope; scopeValue: string },
): Promise<FlagResult> {
  if (!isKnownFeature(input.featureKey))
    return { ok: false, error: "Unknown feature." };
  const scopeValue = normalizeScopeValue(input.scope, input.scopeValue);

  await prisma.$transaction(async (tx) => {
    await tx.featureOverride.deleteMany({
      where: {
        featureKey: input.featureKey,
        scope: input.scope,
        scopeValue,
      },
    });
    await recordAdminAction(tx, {
      actor,
      action: "FEATURE_VISIBILITY_CLEAR",
      entity: "FeatureOverride",
      entityId: input.featureKey,
      meta: { scope: input.scope, scopeValue },
    });
  });
  return { ok: true };
}
