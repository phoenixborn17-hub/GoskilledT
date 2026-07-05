# Review Packet — polish-1 B1: Require EMAIL_UNSUBSCRIBE_SECRET in production (SECURITY)

**Branch:** `gps-polish-1` · **Commit:** `93fac7b` · **Tier:** B — **flagged SECURITY for Opus review** · **Diff:** [`polish-1-b1-hmac-hardening.diff`](polish-1-b1-hmac-hardening.diff)

## What & why

The unsubscribe-link HMAC key previously fell back silently: `EMAIL_UNSUBSCRIBE_SECRET || DATABASE_URL || ""`. Two problems in production: (a) deriving from `DATABASE_URL` means rotating the DB URL silently invalidates every outstanding unsubscribe link; (b) the `|| ""` empty-string fallback is a broken-but-silent state. Hardened so **prod must set a dedicated secret**; dev keeps a convenience fallback.

**Changes**

- `lib/env.ts` — added `EMAIL_UNSUBSCRIBE_SECRET` to the schema; **required in production** via `superRefine` (same mechanism as `PII_ENCRYPTION_KEY`). Boot validation flags it (`validateEnv` throws in prod).
- `lib/email/unsubscribe-token.ts` — `unsubscribeKey()` now: returns the dedicated secret if set; **throws in production** if unset (no `DATABASE_URL` derivation, no empty string); derives from `DATABASE_URL` only in dev/test; throws if even that is missing. No hardcoded secret in code (Golden Rule 5).
- `.env.example` — documents prod-required.

## Test output

```
✓ tests/env.test.ts (7 tests)
  ✓ requires EMAIL_UNSUBSCRIBE_SECRET in production, not in dev (DR-031 security)
  ✓ validateEnv throws in production, warns in dev
✓ tests/unsubscribe-token.test.ts (9 tests)
  ✓ THROWS in production when the dedicated secret is unset (no silent DB fallback)
  ✓ derives from DATABASE_URL in dev when the dedicated secret is unset
  ✓ uses the dedicated secret when set (any environment)
Test Files 2 passed (2) · Tests 16 passed (16)
```

## Self-assessment (5 lines)

1. **Security posture strictly improved**: prod can no longer sign links with a rotate-prone or empty key; fails fast + loud at boot AND at call site.
2. No hardcoded secret; dev ergonomics preserved (laptop still boots without the new var).
3. Boot-time (env schema) and runtime (`unsubscribeKey`) guards are redundant on purpose — defence in depth.
4. **LAUNCH_CONFIG impact:** prod deploys must now set `EMAIL_UNSUBSCRIBE_SECRET` — belongs on the pre-launch env checklist; flagging for a LC row if Opus agrees (not added yet to avoid presuming).
5. Backward-compatible in dev/test; existing signed links in dev keep working (same `DATABASE_URL` derivation).
