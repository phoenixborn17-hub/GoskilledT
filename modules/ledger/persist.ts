// Ledger persistence ADAPTER (Ticket 2, Task 3). Turns a pure TxSpec (built by the
// money-spine domain rules) into LedgerTransaction + LedgerEntry rows. Contains ZERO
// money rules — it only resolves AccountRefs to rows and inserts. Balance is enforced
// by assertBalanced() (domain) + the DB zero-sum trigger (defense-in-depth).
import { Prisma } from "../../lib/generated/prisma";
import { assertBalanced, type AccountRef, type TxSpec } from "./ledger";

/** A Prisma transaction client — every spec of one webhook event runs in ONE $transaction. */
type Tx = Prisma.TransactionClient;

export interface ExecuteResult {
  skipped: boolean; // true when this idempotencyKey was already persisted
  transactionId?: string;
}

function isUniqueViolation(e: unknown, field: string): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const target = e.meta?.target;
    if (Array.isArray(target)) return target.includes(field);
    return String(target ?? "").includes(field);
  }
  return false;
}

/** Resolve a logical AccountRef to a concrete LedgerAccount id, creating the user wallet on first use. */
async function resolveAccountId(tx: Tx, ref: AccountRef): Promise<string> {
  if (ref.kind === "USER_WALLET") {
    const acct = await tx.ledgerAccount.upsert({
      where: { userId: ref.userId },
      create: { type: "USER_WALLET", userId: ref.userId },
      update: {},
      select: { id: true },
    });
    return acct.id;
  }
  // System accounts (REVENUE / COMMISSION_PAYABLE / PAYOUT_CLEARING / GST_PAYABLE) are seeded.
  const acct = await tx.ledgerAccount.findFirst({
    where: { type: ref.kind, userId: null },
    select: { id: true },
  });
  if (!acct) throw new Error(`System ledger account ${ref.kind} not found — run prisma/seed.ts`);
  return acct.id;
}

/**
 * Persist one balanced TxSpec inside an existing Prisma transaction.
 * Idempotent: if the idempotencyKey already exists → { skipped: true } (no double-credit).
 * Only that unique violation is swallowed; every other error propagates.
 */
export async function executeTxSpec(tx: Tx, spec: TxSpec): Promise<ExecuteResult> {
  assertBalanced(spec.legs); // reuse the domain rule — never re-implement it here

  // Primary idempotency guard: a pre-check avoids poisoning the shared Postgres tx on replay.
  const existing = await tx.ledgerTransaction.findUnique({
    where: { idempotencyKey: spec.idempotencyKey },
    select: { id: true },
  });
  if (existing) return { skipped: true };

  const entries = [];
  for (const leg of spec.legs) {
    entries.push({
      accountId: await resolveAccountId(tx, leg.account),
      amountInPaise: leg.amountInPaise,
      holdUntil: leg.holdUntil ?? null,
    });
  }

  try {
    const created = await tx.ledgerTransaction.create({
      data: {
        type: spec.type,
        idempotencyKey: spec.idempotencyKey,
        refType: spec.refType ?? null,
        refId: spec.refId ?? null,
        entries: { create: entries },
      },
      select: { id: true },
    });
    return { skipped: false, transactionId: created.id };
  } catch (e) {
    // Backstop for a concurrent racer that inserted the same key between our pre-check and create.
    if (isUniqueViolation(e, "idempotencyKey")) return { skipped: true };
    throw e; // no other error swallowing
  }
}
