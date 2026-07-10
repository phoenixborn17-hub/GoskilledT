// Feature Visibility admin adapter (DR-040) — set → list → resolve → clear, each with an immutable
// AdminAction audit row. Runs against the real DB when DATABASE_URL is set. Isolated: uses a
// namespaced USER-scope override (no global state touched), and clears it at the end.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  setFeatureOverride,
  clearFeatureOverride,
  listFeatureFlags,
} from "@/lib/admin/feature-visibility";
import { resolveFeature } from "@/lib/feature-visibility/resolver";
import type { AdminIdentity } from "@/lib/auth/admin";

const HAS_DB = !!process.env.DATABASE_URL;
const actor: AdminIdentity = {
  supabaseId: "fvtest-admin",
  email: "fvtest-admin@example.com",
};
const testUserId = `fvtest_${Date.now()}`;

async function overridesForEarn() {
  return (await prisma.featureOverride.findMany({
    where: { featureKey: "earn" },
    select: { featureKey: true, scope: true, scopeValue: true, visible: true },
  })) as {
    featureKey: string;
    scope: "GLOBAL" | "ROLE" | "USER";
    scopeValue: string;
    visible: boolean;
  }[];
}

describe.skipIf(!HAS_DB)("Feature Visibility admin adapter (DR-040)", () => {
  beforeAll(async () => {
    await prisma.featureOverride.deleteMany({
      where: { scope: "USER", scopeValue: testUserId },
    });
  });
  afterAll(async () => {
    await prisma.featureOverride.deleteMany({
      where: { scope: "USER", scopeValue: testUserId },
    });
  });

  it("set USER hide → override listed + audit row + resolver hides that user", async () => {
    const res = await setFeatureOverride(actor, {
      featureKey: "earn",
      scope: "USER",
      scopeValue: testUserId,
      visible: false,
    });
    expect(res.ok).toBe(true);

    const flags = await listFeatureFlags();
    const earn = flags.find((f) => f.key === "earn")!;
    expect(earn.userOverrides).toContainEqual({
      scopeValue: testUserId,
      visible: false,
    });

    // The pure resolver, fed the real DB rows, hides earn for that user but not for others.
    const rows = await overridesForEarn();
    expect(
      resolveFeature("earn", rows, { userId: testUserId, role: "USER" }),
    ).toBe(false);
    expect(
      resolveFeature("earn", rows, { userId: "someone-else", role: "USER" }),
    ).toBe(true);

    const audit = await prisma.adminAction.findFirst({
      where: {
        action: "FEATURE_VISIBILITY_SET",
        entity: "FeatureOverride",
        entityId: "earn",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(audit?.actorSupabaseId).toBe(actor.supabaseId);
    expect((audit?.meta as { scopeValue?: string })?.scopeValue).toBe(
      testUserId,
    );
  });

  it("clear USER override → removed + audit row + resolver reverts to default", async () => {
    const res = await clearFeatureOverride(actor, {
      featureKey: "earn",
      scope: "USER",
      scopeValue: testUserId,
    });
    expect(res.ok).toBe(true);

    const flags = await listFeatureFlags();
    const earn = flags.find((f) => f.key === "earn")!;
    expect(earn.userOverrides.some((o) => o.scopeValue === testUserId)).toBe(
      false,
    );

    const rows = await overridesForEarn();
    expect(
      resolveFeature("earn", rows, { userId: testUserId, role: "USER" }),
    ).toBe(true); // back to default (visible)

    const audit = await prisma.adminAction.findFirst({
      where: {
        action: "FEATURE_VISIBILITY_CLEAR",
        entity: "FeatureOverride",
        entityId: "earn",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(audit?.actorSupabaseId).toBe(actor.supabaseId);
  });

  it("rejects an unknown / non-controllable feature key", async () => {
    const bad = await setFeatureOverride(actor, {
      featureKey: "not-a-real-feature",
      scope: "GLOBAL",
      scopeValue: "",
      visible: false,
    });
    expect(bad.ok).toBe(false);
    const structural = await setFeatureOverride(actor, {
      featureKey: "home", // exists but is not admin-controllable
      scope: "GLOBAL",
      scopeValue: "",
      visible: false,
    });
    expect(structural.ok).toBe(false);
  });
});
