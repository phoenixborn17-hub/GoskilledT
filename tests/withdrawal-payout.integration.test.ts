// GPS-M4 §2.3 — the payout-marking money path (shared DB). Asserts: Mark PAID executes ONE domain
// PAYOUT ledger tx (wallet debit ↔ clearing credit), flips the row, and audits WITHDRAWAL_PAID;
// a double-mark is idempotent (no second ledger tx); a balance drop hard-stops. runId prefix so
// purge-test-data catches the rows.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { executeTxSpec } from "@/modules/ledger/persist";
import { markWithdrawalPaid, rejectWithdrawal } from "@/lib/admin/withdrawals";
import { payoutIdempotencyKey } from "@/modules/wallet/withdrawal";
import { encryptPii } from "@/lib/pii";

const HAS_DB = !!process.env.DATABASE_URL;
const PRIOR_PAYOUTS = process.env.AFFILIATE_PAYOUTS_ENABLED;
const runId = `m4wd${Date.now()}`;
const PAST = new Date(Date.now() - 60_000); // credit already available
const actor = { supabaseId: `admin_${runId}`, email: "admin@example.com" };

async function makeUser(tag: string): Promise<string> {
  const u = await prisma.user.create({
    data: {
      phone: `+91${Math.floor(9e9 + Math.random() * 1e9)}`,
      referralCode: `${runId}${tag}`.toUpperCase(),
      name: `WD ${tag}`,
    },
    select: { id: true },
  });
  return u.id;
}

async function creditWallet(userId: string, amount: number) {
  await prisma.$transaction((tx) =>
    executeTxSpec(tx, {
      type: "COMMISSION",
      idempotencyKey: `commission:${runId}:${userId}:1`,
      refType: "Order",
      refId: `${runId}-order`,
      legs: [
        { account: { kind: "COMMISSION_PAYABLE" }, amountInPaise: -amount },
        {
          account: { kind: "USER_WALLET", userId },
          amountInPaise: amount,
          holdUntil: PAST,
        },
      ],
    }),
  );
}

async function approveKyc(userId: string) {
  await prisma.kyc.create({
    data: {
      userId,
      panEnc: encryptPii("ABCDE1234F"),
      accountNoEnc: encryptPii("123456789012"),
      accountHolderEnc: encryptPii("WD User"),
      ifsc: "SBIN0001234",
      status: "APPROVED",
      submittedAt: new Date(),
    },
  });
}

async function applyWithdrawal(
  userId: string,
  amount: number,
): Promise<string> {
  const w = await prisma.withdrawal.create({
    data: { userId, amountInPaise: amount, status: "APPLIED" },
    select: { id: true },
  });
  return w.id;
}

describe.skipIf(!HAS_DB)("withdrawal payout marking (integration)", () => {
  beforeAll(() => {
    // Deterministic 32-byte AES key for the KYC PII roundtrip (the .env dev value is a placeholder).
    process.env.PII_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString("base64");
    // Phase C: the payout ledger tx only fires when payouts are ON. These tests EXERCISE that path,
    // so enable it here (and restore after). The D-01 OFF gate is covered separately below.
    process.env.AFFILIATE_PAYOUTS_ENABLED = "true";
  });
  afterAll(() => {
    if (PRIOR_PAYOUTS === undefined)
      delete process.env.AFFILIATE_PAYOUTS_ENABLED;
    else process.env.AFFILIATE_PAYOUTS_ENABLED = PRIOR_PAYOUTS;
  });

  it("Mark PAID executes a balanced PAYOUT ledger tx, flips the row, and audits", async () => {
    const userId = await makeUser("A");
    await creditWallet(userId, 80_000); // ₹800 available
    await approveKyc(userId);
    const wid = await applyWithdrawal(userId, 50_000); // ₹500

    const res = await markWithdrawalPaid(actor, wid);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.idempotent).toBe(false);

    // Ledger: exactly one PAYOUT tx keyed by the withdrawal, balanced, wallet -₹500 / clearing +₹500.
    const tx = await prisma.ledgerTransaction.findUnique({
      where: { idempotencyKey: payoutIdempotencyKey(wid) },
      select: { type: true, entries: { select: { amountInPaise: true } } },
    });
    expect(tx?.type).toBe("PAYOUT");
    const sum = (tx?.entries ?? []).reduce((a, e) => a + e.amountInPaise, 0);
    expect(sum).toBe(0);
    expect((tx?.entries ?? []).some((e) => e.amountInPaise === -50_000)).toBe(
      true,
    );

    const row = await prisma.withdrawal.findUniqueOrThrow({
      where: { id: wid },
      select: { status: true, paidAt: true },
    });
    expect(row.status).toBe("PAID");
    expect(row.paidAt).not.toBeNull();

    const audit = await prisma.adminAction.findFirst({
      where: { action: "WITHDRAWAL_PAID", entityId: wid },
    });
    expect(audit).not.toBeNull();
    expect(audit!.actorSupabaseId).toBe(actor.supabaseId);
  });

  it("double-mark is idempotent — no second ledger tx", async () => {
    const userId = await makeUser("B");
    await creditWallet(userId, 80_000);
    await approveKyc(userId);
    const wid = await applyWithdrawal(userId, 50_000);

    const first = await markWithdrawalPaid(actor, wid);
    expect(first.ok).toBe(true);
    const second = await markWithdrawalPaid(actor, wid);
    // Guard catches ALREADY_PAID before touching the ledger.
    expect(second.ok).toBe(false);

    const count = await prisma.ledgerTransaction.count({
      where: { idempotencyKey: payoutIdempotencyKey(wid) },
    });
    expect(count).toBe(1);
  });

  it("hard-stops when available balance dropped below the requested amount", async () => {
    const userId = await makeUser("C");
    await creditWallet(userId, 40_000); // only ₹400 available
    await approveKyc(userId);
    const wid = await applyWithdrawal(userId, 50_000); // asked ₹500

    const res = await markWithdrawalPaid(actor, wid);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/below the requested/i);

    const count = await prisma.ledgerTransaction.count({
      where: { idempotencyKey: payoutIdempotencyKey(wid) },
    });
    expect(count).toBe(0); // no money moved
  });

  it("payoutsEnabled OFF ⇒ Mark PAID is refused and NO payout ledger tx executes (D-01, §6)", async () => {
    const userId = await makeUser("E");
    await creditWallet(userId, 80_000);
    await approveKyc(userId);
    const wid = await applyWithdrawal(userId, 50_000);

    process.env.AFFILIATE_PAYOUTS_ENABLED = "false"; // flip OFF for this case only
    try {
      const res = await markWithdrawalPaid(actor, wid);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toMatch(/disabled|D-01/i);
    } finally {
      process.env.AFFILIATE_PAYOUTS_ENABLED = "true";
    }

    const count = await prisma.ledgerTransaction.count({
      where: { idempotencyKey: payoutIdempotencyKey(wid) },
    });
    expect(count).toBe(0); // no money moved
    const row = await prisma.withdrawal.findUniqueOrThrow({
      where: { id: wid },
      select: { status: true },
    });
    expect(row.status).toBe("APPLIED"); // untouched
  });

  it("reject leaves funds available and audits the reason (no ledger move)", async () => {
    const userId = await makeUser("D");
    await creditWallet(userId, 80_000);
    await approveKyc(userId);
    const wid = await applyWithdrawal(userId, 50_000);

    const res = await rejectWithdrawal(actor, wid, "name mismatch on bank");
    expect(res.ok).toBe(true);

    const row = await prisma.withdrawal.findUniqueOrThrow({
      where: { id: wid },
      select: { status: true, adminNote: true },
    });
    expect(row.status).toBe("REJECTED");
    expect(row.adminNote).toMatch(/name mismatch/);

    const count = await prisma.ledgerTransaction.count({
      where: { idempotencyKey: payoutIdempotencyKey(wid) },
    });
    expect(count).toBe(0);
  });
});
