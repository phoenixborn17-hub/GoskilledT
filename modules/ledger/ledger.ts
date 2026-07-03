// Double-entry ledger primitives. A transaction's signed entries MUST sum to zero.
// DR-025: commission credits carry holdUntil — HELD until the refund window closes.
// Available = holdUntil null/past. Held = visible in UI, never withdrawable.

/** Logical account reference — the DB adapter resolves this to a LedgerAccount row. */
export type AccountRef =
  | { kind: "USER_WALLET"; userId: string }
  | { kind: "COMMISSION_PAYABLE" }
  | { kind: "REVENUE" }
  | { kind: "PAYOUT_CLEARING" }
  | { kind: "GST_PAYABLE" };

export function accountKey(ref: AccountRef): string {
  return ref.kind === "USER_WALLET" ? `USER_WALLET:${ref.userId}` : ref.kind;
}

export interface LedgerLeg {
  account: AccountRef;
  amountInPaise: number; // signed: +credit / -debit
  holdUntil?: Date | null;
}

/** A fully-specified ledger transaction, ready for the DB adapter to persist atomically. */
export interface TxSpec {
  type: "COMMISSION" | "PAYOUT" | "ADJUSTMENT" | "CLAWBACK";
  idempotencyKey: string;
  refType?: string;
  refId?: string;
  legs: LedgerLeg[];
}

export function assertBalanced(legs: { amountInPaise: number }[]): void {
  const sum = legs.reduce((a, l) => a + l.amountInPaise, 0);
  if (sum !== 0)
    throw new Error(`Unbalanced ledger transaction: sum=${sum} (must be 0)`);
  if (legs.length < 2)
    throw new Error("A ledger transaction needs at least 2 legs");
}

/** Total balance = sum of ALL entry amounts (held + available). */
export function balanceOf(entries: { amountInPaise: number }[]): number {
  return entries.reduce((a, e) => a + e.amountInPaise, 0);
}

/** AVAILABLE balance — excludes credits still inside the refund-hold window (DR-025). */
export function availableBalanceOf(
  entries: { amountInPaise: number; holdUntil?: Date | null }[],
  now: Date = new Date(),
): number {
  return entries.reduce(
    (a, e) => (!e.holdUntil || e.holdUntil <= now ? a + e.amountInPaise : a),
    0,
  );
}

/** HELD balance — visible to the affiliate but not yet withdrawable (DR-025 UX rule). */
export function heldBalanceOf(
  entries: { amountInPaise: number; holdUntil?: Date | null }[],
  now: Date = new Date(),
): number {
  return entries.reduce(
    (a, e) => (e.holdUntil && e.holdUntil > now ? a + e.amountInPaise : a),
    0,
  );
}

/**
 * Compensating legs for a reversal (DR-025 clawback): same accounts, negated amounts,
 * and the SAME holdUntil as the leg being reversed — so a clawback nets held→0 without
 * ever pushing the available balance negative during the remaining hold window.
 * Original entries are NEVER mutated — the ledger is append-only.
 */
export function reversalLegs(legs: LedgerLeg[]): LedgerLeg[] {
  const reversed = legs.map((l) => ({
    account: l.account,
    amountInPaise: -l.amountInPaise,
    holdUntil: l.holdUntil ?? null,
  }));
  assertBalanced(reversed);
  return reversed;
}
