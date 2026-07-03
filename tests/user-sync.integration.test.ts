// Ticket 3, Task 6 — user sync: referral attribution, duplicate prevention, phone linking.
// Runs against the live DB (skips without DATABASE_URL). Ids namespaced per run.
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/auth/user-sync";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = String(Date.now()).slice(-8);
const phone = (d: string) => `+919${d}${runId}`; // unique 10-digit-ish per run

describe.skipIf(!HAS_DB)("user sync (integration)", () => {
  it("creates a new user and attributes the referral", async () => {
    const referrer = await prisma.user.create({
      data: { supabaseId: `sb_ref_${runId}`, phone: phone("1"), referralCode: `REF${runId}` },
      select: { id: true },
    });
    const res = await syncUser({ id: `sb_new_${runId}`, phone: phone("2") }, `ref${runId}`); // lower-case → uppercased internally
    expect(res.supabaseId).toBe(`sb_new_${runId}`);
    expect(res.referredById).toBe(referrer.id);
    expect(res.referralCode).toMatch(/^GS[0-9A-F]{8}$/);
  });

  it("is idempotent — same supabaseId never duplicates", async () => {
    const id = `sb_idem_${runId}`;
    const first = await syncUser({ id, phone: phone("3") });
    const second = await syncUser({ id, phone: phone("3") });
    expect(second.id).toBe(first.id);
    expect(await prisma.user.count({ where: { supabaseId: id } })).toBe(1);
  });

  it("links an existing phone-only user (checkout-created) to the Supabase id", async () => {
    const p = phone("4");
    const pre = await prisma.user.create({ data: { phone: p, referralCode: `PC${runId}` }, select: { id: true } });
    const res = await syncUser({ id: `sb_link_${runId}`, phone: p });
    expect(res.id).toBe(pre.id); // same row, not a duplicate
    expect(res.supabaseId).toBe(`sb_link_${runId}`);
    expect(await prisma.user.count({ where: { phone: p } })).toBe(1);
  });

  it("ignores unknown referral codes (no false attribution)", async () => {
    const res = await syncUser({ id: `sb_noref_${runId}`, phone: phone("5") }, "DOES-NOT-EXIST");
    expect(res.referredById).toBeNull();
  });
});
