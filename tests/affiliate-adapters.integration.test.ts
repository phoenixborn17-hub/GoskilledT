// GPS-M3 adapter integration tests (shared DB). Exercises the REAL money path (executeTxSpec →
// balanced ledger transactions, honoring the DB zero-sum trigger) and the PII encryption roundtrip.
// runId "LMS…" prefix so purge-test-data catches these rows.
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { executeTxSpec } from "@/modules/ledger/persist";
import {
  getWalletSummaryFor,
  getHeldCredits,
  getCommissionLines,
  hasPendingWithdrawal,
} from "@/lib/wallet/queries";
import { getReferralTree } from "@/lib/affiliate/referrals";
import { getKycView } from "@/lib/kyc/queries";
import { encryptPii } from "@/lib/pii";

const HAS_DB = !!process.env.DATABASE_URL;
const runId = `lmsaff${Date.now()}`;
const NOW = new Date();
const FUTURE = new Date(NOW.getTime() + 24 * 60 * 60 * 1000); // still in 48h hold
const PAST = new Date(NOW.getTime() - 60 * 1000); // cleared

async function makeUser(tag: string, referredById?: string): Promise<string> {
  const u = await prisma.user.create({
    data: {
      phone: `+91${Math.floor(9e9 + Math.random() * 1e9)}`,
      referralCode: `${runId}${tag}`.toUpperCase(),
      name: `User ${tag}`,
      referredById: referredById ?? null,
    },
    select: { id: true },
  });
  return u.id;
}

async function commission(
  orderId: string,
  userId: string,
  level: number,
  amount: number,
  holdUntil: Date | null,
) {
  await prisma.$transaction((tx) =>
    executeTxSpec(tx, {
      type: "COMMISSION",
      idempotencyKey: `commission:${orderId}:${userId}:${level}`,
      refType: "Order",
      refId: orderId,
      legs: [
        { account: { kind: "COMMISSION_PAYABLE" }, amountInPaise: -amount },
        {
          account: { kind: "USER_WALLET", userId },
          amountInPaise: amount,
          holdUntil,
        },
      ],
    }),
  );
}

async function clawback(
  orderId: string,
  userId: string,
  level: number,
  amount: number,
  holdUntil: Date,
) {
  await prisma.$transaction((tx) =>
    executeTxSpec(tx, {
      type: "CLAWBACK",
      idempotencyKey: `clawback:${orderId}:${userId}:${level}`,
      refType: "Order",
      refId: orderId,
      legs: [
        { account: { kind: "COMMISSION_PAYABLE" }, amountInPaise: amount },
        {
          account: { kind: "USER_WALLET", userId },
          amountInPaise: -amount,
          holdUntil,
        },
      ],
    }),
  );
}

describe.skipIf(!HAS_DB)("affiliate adapters (integration)", () => {
  let userId: string;

  beforeAll(async () => {
    process.env.PII_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString("base64");

    userId = await makeUser("ROOT");

    // Referral chain: two L1s, one L2 under the first L1.
    const l1a = await makeUser("L1A", userId);
    await makeUser("L1B", userId);
    await makeUser("L2", l1a);

    // Package + three orders for commission fixtures.
    const pkg = await prisma.package.create({
      data: {
        slug: `aff-pkg-${runId}`,
        name: "Test Package",
        priceInPaise: 219900,
      },
      select: { id: true },
    });
    const mkOrder = async () =>
      (
        await prisma.order.create({
          data: {
            userId,
            packageId: pkg.id,
            amountInPaise: 219900,
            status: "PAID",
          },
          select: { id: true },
        })
      ).id;
    const o1 = await mkOrder();
    const o2 = await mkOrder();
    const o3 = await mkOrder();

    await commission(o1, userId, 1, 90_000, FUTURE); // HELD → then clawed back
    await clawback(o1, userId, 1, 90_000, FUTURE); // nets held to 0, CANCELLED line
    await commission(o2, userId, 1, 15_000, PAST); // AVAILABLE
    await commission(o3, userId, 2, 50_000, FUTURE); // HELD
  });

  it("wallet summary derives held/available/total from the ledger", async () => {
    const s = await getWalletSummaryFor(userId, NOW);
    expect(s.heldInPaise).toBe(50_000); // 90k held − 90k clawback + 50k held
    expect(s.availableInPaise).toBe(15_000);
    expect(s.totalInPaise).toBe(65_000);
  });

  it("held credits list only the still-held positive credits", async () => {
    const held = await getHeldCredits(userId, NOW);
    // The 50k HELD credit; the 90k was clawed back (net held 0 but the +90k credit is still a row).
    const amounts = held.map((h) => h.amountInPaise).sort((a, b) => a - b);
    expect(amounts).toEqual([50_000, 90_000]);
    expect(held.every((h) => h.holdUntil > NOW)).toBe(true);
  });

  it("commission lines carry level, package name, and state (incl. CANCELLED clawback)", async () => {
    const lines = await getCommissionLines(userId, NOW);
    expect(lines.length).toBe(4);
    expect(lines.every((l) => l.packageName === "Test Package")).toBe(true);
    expect(
      lines.some((l) => l.state === "CANCELLED" && l.amountInPaise < 0),
    ).toBe(true);
    expect(lines.some((l) => l.state === "HELD" && l.level === 2)).toBe(true);
    expect(lines.some((l) => l.state === "AVAILABLE" && l.level === 1)).toBe(
      true,
    );
  });

  it("referral tree: L1 names shown, L2/L3 as counts (privacy)", async () => {
    const tree = await getReferralTree(userId);
    expect(tree.l1Count).toBe(2);
    expect(tree.l2Count).toBe(1);
    expect(tree.l3Count).toBe(0);
    expect(tree.l1.map((p) => p.name).sort()).toEqual([`User L1A`, `User L1B`]);
  });

  it("KYC is encrypted at rest and only ever masked in the view", async () => {
    const key = Buffer.from(process.env.PII_ENCRYPTION_KEY!, "base64");
    await prisma.kyc.create({
      data: {
        userId,
        panEnc: encryptPii("ABCDE1234F", key),
        accountNoEnc: encryptPii("123456789012", key),
        accountHolderEnc: encryptPii("Root User", key),
        ifsc: "SBIN0001234",
        status: "APPROVED",
        submittedAt: new Date(),
      },
    });
    // Raw row is ciphertext — plaintext PAN never stored.
    const raw = await prisma.kyc.findUniqueOrThrow({
      where: { userId },
      select: { panEnc: true },
    });
    expect(raw.panEnc).not.toContain("ABCDE1234F");

    const view = await getKycView(userId);
    expect(view.uiStatus).toBe("VERIFIED");
    expect(view.panMasked).toBe("•••• 234F");
    expect(view.accountMasked).toBe("•••• 9012");
    expect(view.ifsc).toBe("SBIN0001234");
    expect(view.holderName).toBe("Root User");
  });

  it("hasPendingWithdrawal flips after a request", async () => {
    expect(await hasPendingWithdrawal(userId)).toBe(false);
    await prisma.withdrawal.create({
      data: { userId, amountInPaise: 15_000, status: "APPLIED" },
    });
    expect(await hasPendingWithdrawal(userId)).toBe(true);
  });
});
