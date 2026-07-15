// Feature Batch v1.0 §2 — banner CRUD against directly-seeded rows (bypasses uploadBannerMedia,
// which needs a real SUPABASE_SERVICE_ROLE_KEY unavailable in this environment — same limitation
// as KYC doc upload, which isn't integration-tested here either; see tests/kyc-storage.test.ts).
// Covers: the live-window query (active/date-range filtering), setActive, setOrder, delete, and
// the admin audit trail each mutation writes.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  listLiveBanners,
  setBannerActive,
  setBannerOrder,
  deleteBanner,
} from "@/lib/admin/banner";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = String(Date.now()).slice(-8);
const actor = { supabaseId: `admin_banner_${runId}`, email: "admin@test.local" };

describe.skipIf(!HAS_DB)("listLiveBanners (active + date-range window)", () => {
  const now = new Date("2026-06-15T00:00:00Z");

  beforeAll(async () => {
    await prisma.promoBanner.createMany({
      data: [
        {
          mediaType: "IMAGE",
          mediaKey: `${runId}-live-no-window.png`,
          order: 3,
          active: true,
          createdBy: actor.supabaseId,
        },
        {
          mediaType: "IMAGE",
          mediaKey: `${runId}-live-in-window.png`,
          order: 1,
          active: true,
          startAt: new Date("2026-06-01T00:00:00Z"),
          endAt: new Date("2026-06-30T00:00:00Z"),
          createdBy: actor.supabaseId,
        },
        {
          mediaType: "IMAGE",
          mediaKey: `${runId}-expired.png`,
          order: 2,
          active: true,
          startAt: new Date("2026-01-01T00:00:00Z"),
          endAt: new Date("2026-02-01T00:00:00Z"), // ended before `now`
          createdBy: actor.supabaseId,
        },
        {
          mediaType: "IMAGE",
          mediaKey: `${runId}-not-yet.png`,
          order: 4,
          active: true,
          startAt: new Date("2026-12-01T00:00:00Z"), // starts after `now`
          createdBy: actor.supabaseId,
        },
        {
          mediaType: "IMAGE",
          mediaKey: `${runId}-inactive.png`,
          order: 0,
          active: false, // never live regardless of window
          createdBy: actor.supabaseId,
        },
      ],
    });
  });

  it("returns only active banners whose window includes `now`, ordered by rotation order", async () => {
    const live = await listLiveBanners(now);

    const rows = await prisma.promoBanner.findMany({
      where: { createdBy: actor.supabaseId },
      orderBy: { order: "asc" },
    });
    const liveIds = new Set(live.map((b) => b.id));
    const ours = rows.filter((r) => liveIds.has(r.id));
    const ourKeys = ours.map((r) => r.mediaKey);
    expect(ourKeys).toEqual([
      `${runId}-live-in-window.png`,
      `${runId}-live-no-window.png`,
    ]);
  });
});

describe.skipIf(!HAS_DB)("banner mutations (active / order / delete) + audit trail", () => {
  let bannerId: string;

  beforeAll(async () => {
    const b = await prisma.promoBanner.create({
      data: {
        mediaType: "IMAGE",
        mediaKey: `${runId}-mutate.png`,
        order: 0,
        active: true,
        createdBy: actor.supabaseId,
      },
      select: { id: true },
    });
    bannerId = b.id;
  });

  it("setBannerActive flips the flag and writes an audit row", async () => {
    const res = await setBannerActive(actor, bannerId, false);
    expect(res.ok).toBe(true);
    const row = await prisma.promoBanner.findUnique({ where: { id: bannerId } });
    expect(row?.active).toBe(false);
    const audit = await prisma.adminAction.findFirst({
      where: { entity: "PromoBanner", entityId: bannerId, action: "BANNER_UPDATED" },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).not.toBeNull();
    expect(audit?.actorSupabaseId).toBe(actor.supabaseId);
  });

  it("setBannerOrder updates the rotation order", async () => {
    const res = await setBannerOrder(actor, bannerId, 42);
    expect(res.ok).toBe(true);
    const row = await prisma.promoBanner.findUnique({ where: { id: bannerId } });
    expect(row?.order).toBe(42);
  });

  it("deleteBanner removes the row and writes an audit row", async () => {
    const res = await deleteBanner(actor, bannerId);
    expect(res.ok).toBe(true);
    const row = await prisma.promoBanner.findUnique({ where: { id: bannerId } });
    expect(row).toBeNull();
    const audit = await prisma.adminAction.findFirst({
      where: { entity: "PromoBanner", entityId: bannerId, action: "BANNER_DELETED" },
    });
    expect(audit).not.toBeNull();
  });
});
