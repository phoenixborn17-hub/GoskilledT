-- GoSkilled vNext — DB-level money-safety constraints.
-- Apply with the FIRST migration (prisma migrate dev --create-only, then paste in).
-- Defense-in-depth beyond application-level assertBalanced() — Blueprint v1.1 §5.

-- 1. Withdrawal: single-pending guard (only one APPLIED/IN_PROGRESS per user).
CREATE UNIQUE INDEX IF NOT EXISTS withdrawal_single_pending
  ON "Withdrawal" ("userId")
  WHERE "status" IN ('APPLIED', 'IN_PROGRESS');

-- 2. Ledger: every transaction's entries must sum to zero (double-entry invariant).
--    Deferred constraint trigger: checked at COMMIT so both legs can insert first.
CREATE OR REPLACE FUNCTION assert_ledger_tx_balanced() RETURNS trigger AS $$
DECLARE tx_sum BIGINT;
BEGIN
  SELECT COALESCE(SUM("amountInPaise"), 0) INTO tx_sum
  FROM "LedgerEntry" WHERE "transactionId" = NEW."transactionId";
  IF tx_sum <> 0 THEN
    RAISE EXCEPTION 'Unbalanced ledger transaction %: sum=% (must be 0)', NEW."transactionId", tx_sum;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ledger_tx_balanced ON "LedgerEntry";
CREATE CONSTRAINT TRIGGER ledger_tx_balanced
  AFTER INSERT OR UPDATE ON "LedgerEntry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_ledger_tx_balanced();

-- 3. Ledger entries are append-only (no UPDATE/DELETE ever).
CREATE OR REPLACE FUNCTION forbid_ledger_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'LedgerEntry is append-only (%). Reverse with a compensating transaction.', TG_OP;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ledger_append_only ON "LedgerEntry";
CREATE TRIGGER ledger_append_only
  BEFORE UPDATE OR DELETE ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION forbid_ledger_mutation();
