// Feature Visibility System (DR-040) — server-side context + enforcement helpers.
//
// Loads the current user's context + all scope overrides ONCE per request (React cache), resolves
// every feature, and exposes the checks that route guards / server actions / API handlers / the nav
// builder use. This is the SERVER enforcement seam — a hidden feature's pages, actions, and routes
// call assertFeatureVisible() and become 404, never merely CSS-hidden.
//
// SERVER-ONLY by convention: this module touches Prisma + the session. Client components must NOT
// import it — they consume the server-resolved visibility MAP (passed as a prop) via the pure
// helpers in ./index. (The `server-only` npm guard isn't a dependency of this project.)
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "../prisma";
import { getCurrentUser } from "../auth/session";
import { FEATURES, type FeatureKey } from "./registry";
import {
  resolveAllFeatures,
  type FeatureOverrideRow,
  type UserContext,
} from "./resolver";

/** {userId, role} for the current request — anonymous ({null,null}) on public pages. */
export const getVisibilityContext = cache(async (): Promise<UserContext> => {
  const user = await getCurrentUser();
  if (!user) return { userId: null, role: null };
  const rec = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  return { userId: user.id, role: rec?.role ?? "USER" };
});

// Load every override in one query. Returns null on DB failure so the caller can fail SAFE (hidden)
// rather than fail OPEN (leaking a hidden feature because a read errored).
const loadOverrides = cache(async (): Promise<FeatureOverrideRow[] | null> => {
  try {
    const rows = await prisma.featureOverride.findMany({
      select: {
        featureKey: true,
        scope: true,
        scopeValue: true,
        visible: true,
      },
    });
    return rows as FeatureOverrideRow[];
  } catch {
    return null;
  }
});

/** The FAIL-SAFE map used when overrides can't be read: fail-safe features hidden, structural kept. */
function failSafeMap(): Record<FeatureKey, boolean> {
  const out = {} as Record<FeatureKey, boolean>;
  for (const key of Object.keys(FEATURES) as FeatureKey[]) {
    const def = FEATURES[key];
    out[key] = def.failSafeHidden ? false : def.defaultVisible;
  }
  return out;
}

/** The resolved visible/hidden map for every feature, for this request's user. Memoised. */
export const getVisibleFeatures = cache(
  async (): Promise<Record<FeatureKey, boolean>> => {
    const [ctx, overrides] = await Promise.all([
      getVisibilityContext(),
      loadOverrides(),
    ]);
    if (overrides === null) return failSafeMap();
    return resolveAllFeatures(overrides, ctx);
  },
);

/** Server-side single-feature check. */
export async function isFeatureVisible(key: FeatureKey): Promise<boolean> {
  return (await getVisibleFeatures())[key];
}

/**
 * Route/action guard: if the feature is hidden for this user, render 404 — the page/action/route is
 * UNREACHABLE, not just visually removed. Use at the top of a hidden feature's layout, server
 * actions, and route handlers.
 */
export async function assertFeatureVisible(key: FeatureKey): Promise<void> {
  if (!(await isFeatureVisible(key))) notFound();
}
