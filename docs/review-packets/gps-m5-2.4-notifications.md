# Review Packet — GPS-M5 §2.4 Notifications v1 (Tier A)

**Branch:** `gps-m5-premium` · **Ticket:** GPS-M5 §2.4 · **Tier:** A (sends + schema + provider) + B (toggle UI).
**NOT merged.** Spec: `docs/specs/GPS-M5_Premium_v1.0.md` §2.4 · **Companion:** `gps-m5-2.4-notifications.diff`
(598 lines) · verification shots in `docs/qa/GPS-M5/notifications/` (git-ignored).

## What was built

Welcome + certificate-ready emails, on a shared premium template, idempotent + opt-out-aware.

- **Provider** — REUSED the existing `console|resend` email provider (= mock|live) + `softWarnProductionEmail`
  (mock-in-prod soft-warns, DR-029). No new provider built; the pattern already exists.
- **Schema (Tier-A slice):** additive nullable `User.emailOptOut` (non-breaking; User already RLS) +
  new `EmailLog` send-log — migration `20260705040000_notifications`, **EmailLog RLS-ENABLED** (verified live).
- **Shared template** (`lib/email/template.ts`, pure): green wordmark, warm body, CTA, **EDZERA LLP trust
  line + one-click unsubscribe on every email**. Builders `buildWelcomeEmail` / `buildCertificateReadyEmail`.
- **Idempotent, opt-out-aware senders** (`lib/email/notify.ts`): `maybeSendWelcomeEmail` (fires when the
  learner's email is first saved at onboarding) + `maybeSendCertificateEmail` (fires on issuance, both
  sites). **Claim-before-send** via `EmailLog` unique `dedupeKey` → a double-send is impossible; a hard
  `emailOptOut` suppresses even these; no-email → no send.
- **Unsubscribe** (`/unsubscribe`, public, Tier-B): confirm-on-SUBMIT (not on load) so scanner prefetch
  can't opt a learner out; cuid = token; idempotent + reversible.
- **Settings toggle** (Tier-B): `EmailPrefToggle` on `/dashboard/profile` → `setEmailOptOutAction`.

## Idempotency + consent — proven (`tests/notifications.integration.test.ts`, live DB)

1. Welcome sends **once** (one `EmailLog` claim), never twice on repeat calls.
2. Hard **opt-out suppresses** the send (no claim).
3. **No email → no send.**
4. Certificate-ready **dedupes by serial**; opt-out respected.
Plus pure builder tests (`email-notifications`): D-29-safe copy (no income words in html/text),
unsubscribe present, correct CTA hrefs + dedupe keys.

```
email-notifications (4) + notifications.integration (4) + email (9) → 17 passed
Full suite: 256 passed / 35 files (was 248/33). tsc + prettier clean.
```

## Security / architecture

- Best-effort by contract (never breaks a flow); mirrors the existing receipt path.
- **No PII in EmailLog** (dedupeKey + internal userId + kind only). `EmailLog` RLS-on.
- `emailOptOut` honored in every sender + surfaced in Settings; unsubscribe is public but the token is
  an unguessable cuid.
- Pure builders (template + copy) unit-tested; adapters thin.

## Verified in-browser

Welcome email renders premium (green wordmark, "Start learning" CTA, EDZERA LLP + unsubscribe footer);
cert-ready email likewise. Profile "Email preferences" toggle (switch) + unsubscribe confirm page render
correctly. Console provider logged both emails with D-29-safe subjects. No console/hydration errors.

## Self-assessment (5 lines)

1. Idempotency is structural (claim-before-send on a unique key) — double-send is impossible, proven by tests.
2. Consent is honored everywhere (opt-out suppresses even milestone emails) + reversible from Settings.
3. Reused the existing provider rather than duplicating — less surface, consistent prod-guard.
4. **Live Resend path untested** (no account — LC #22); console/mock fully tested. Documented BLOCKED-for-test.
5. Unsubscribe uses the cuid as token — a dedicated signed token is a noted hardening follow-up (non-blocking).

## Tier-A checklist

- [x] `npm run typecheck` clean · prettier clean
- [x] ALL tests green — unit + live integration (idempotency + opt-out are the centrepiece)
- [x] Architecture: pure builders, thin senders, provider reused; sends never block a flow
- [x] Security: no PII in the send-log, EmailLog RLS-on, opt-out honored, unsubscribe on every email
- [x] Migration is additive + non-breaking (nullable column + new table)
- [x] No Blueprint/Constitution/DR conflict · D-29 copy sweep (tested)
- [x] Docs updated (LAUNCH_CONFIG #22 refreshed + #39 email copy)
- [x] Git commit created on branch — NOT merged (awaiting consolidated Fable PASS)
