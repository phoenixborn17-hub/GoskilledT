// Phase B / B3 (privacy-critical) — the masked My-Network read. Asserts the server payload:
//   • L1 rows carry first name + masked mobile (never the full number) + packages
//   • L2/L3 rows carry NO name and NO phone field at all (privacy by construction)
//   • date + package filters work
//   • the L1 export (server-only) DOES include the real mobile
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getReferralNetwork, getL1Export } from "@/lib/affiliate/network";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = String(Date.now()).slice(-8);
let seq = 0;
const uniquePhone = () =>
  `+91${9_000_000_000 + ((Number(runId) + seq++) % 1_000_000_000)}`;

async function mk(
  referredById: string | null,
  name: string | null,
): Promise<{ id: string; phone: string }> {
  const phone = uniquePhone();
  const u = await prisma.user.create({
    data: {
      phone,
      name,
      referralCode: `GN${runId}${seq}`.toUpperCase(),
      referredById,
    },
    select: { id: true },
  });
  return { id: u.id, phone };
}

describe.skipIf(!HAS_DB)("My-Network masked read (B3 integration)", () => {
  let root: string;
  let l1Phone: string;
  let cbId: string;

  beforeAll(async () => {
    const cb = await prisma.package.upsert({
      where: { slug: "career-booster" },
      update: {},
      create: {
        slug: "career-booster",
        name: "Career Booster",
        priceInPaise: 219900,
        isActive: true,
      },
      select: { id: true },
    });
    cbId = cb.id;

    const r = await mk(null, "Network Root");
    root = r.id;
    const a = await mk(root, "Asha Sharma"); // L1 (direct)
    l1Phone = a.phone;
    const b = await mk(a.id, "Bala Menon"); // L2
    await mk(b.id, "Chetan Rao"); // L3
    // Give the L1 member a PAID order (for the package filter + packages column).
    await prisma.order.create({
      data: {
        userId: a.id,
        packageId: cbId,
        amountInPaise: 219900,
        status: "PAID",
      },
    });
  });

  it("L1 shows first name + MASKED mobile + packages; full number never in the payload", async () => {
    const net = await getReferralNetwork(root);
    expect(net.counts.l1).toBe(1);
    const row = net.l1[0];
    expect(row.firstName).toBe("Asha");
    expect(row.mobileMasked).toMatch(/^•+ \d{4}$/); // "•••• 5678"
    expect(row.mobileMasked).not.toContain(l1Phone.slice(0, 6)); // no full number
    expect(row.packages).toContain("Career Booster");
    // The row object must NOT carry a raw phone/mobile field.
    expect(Object.keys(row)).not.toContain("phone");
    expect(Object.keys(row)).not.toContain("mobile");
  });

  it("L2 and L3 rows contain NO name and NO phone (asserted on the server payload)", async () => {
    const net = await getReferralNetwork(root);
    expect(net.counts.l2).toBe(1);
    expect(net.counts.l3).toBe(1);
    for (const row of [...net.l2, ...net.l3]) {
      const keys = Object.keys(row);
      expect(keys).toEqual(["joinedAt"]); // ONLY joinedAt — no name, no phone, nothing else
    }
  });

  it("package filter keeps only downlines with a PAID order for that package", async () => {
    const match = await getReferralNetwork(root, {
      packageSlug: "career-booster",
    });
    expect(match.counts.l1).toBe(1); // Asha bought Career Booster
    const none = await getReferralNetwork(root, {
      packageSlug: "skill-builder",
    });
    expect(none.counts.l1).toBe(0); // nobody bought Skill Builder
  });

  it("date filter (future 'from') excludes everyone", async () => {
    const future = new Date(Date.now() + 365 * 864e5);
    const net = await getReferralNetwork(root, { from: future });
    expect(net.counts.l1 + net.counts.l2 + net.counts.l3).toBe(0);
  });

  it("the L1 export (server-only) DOES include the real mobile", async () => {
    const rows = await getL1Export(root);
    expect(rows).toHaveLength(1);
    expect(rows[0].mobile).toBe(l1Phone); // full number — server-side export only
    expect(rows[0].name).toBe("Asha Sharma");
  });
});
