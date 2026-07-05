# Review Packet — polish-1 B1: Guardrail regression lock

**Branch:** `gps-polish-1` · **Commit:** `ff834a9` · **Tier:** B · **Diff:** [`polish-1-b1-guardrail-lock.diff`](polish-1-b1-guardrail-lock.diff)

## What & why

Fable's Tier-A follow-up asked to pin the four exact income-intent cases it prescribed so a future guardrail edit can't silently regress them. Behaviour was already correct; this is a **regression lock**, test-only — no production code changed.

Added `describe("guardrail: Fable prescribed regression cases (verbatim)")` in `tests/guru-domain.test.ts` with the four cases verbatim:

| Input                         | Expected       |
| ----------------------------- | -------------- |
| `50000 monthly kama sakte ho` | BLOCK (`true`) |
| `₹2 lakh per month`           | BLOCK (`true`) |
| `Lesson 5 me 3 steps hain`    | NOT (`false`)  |
| `iska price 1499 hai`         | NOT (`false`)  |

## Test output

```
✓ tests/guru-domain.test.ts (27 tests)
  ✓ guardrail: Fable prescribed regression cases (verbatim) › 50000 monthly kama sakte ho → income intent true
  ✓ … › ₹2 lakh per month → income intent true
  ✓ … › Lesson 5 me 3 steps hain → income intent false
  ✓ … › iska price 1499 hai → income intent false
Test Files 1 passed (1) · Tests 27 passed (27)
```

## Self-assessment (5 lines)

1. Test-only; zero production-code risk.
2. Uses `it.each` with the strings exactly as prescribed — no paraphrasing.
3. Covers both BLOCK (amount+period+earn, scaled-currency+period) and NOT (lesson/step numbers, bare price) — the two false-positive traps.
4. Complements the existing condition-1 hardening block; both now guard the same code path.
5. No D-29 risk — the NOT cases confirm we don't over-block legitimate course content.
