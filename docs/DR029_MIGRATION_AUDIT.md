# DR-029 Retroactive Compliance Audit & Migration Plan

**Date:** 2026-07-04 · **Auditor:** Fable (CTO) · **Standard:** DR-029 Two-Layer Development Rule
**Method:** every module/page/flow from GPS Master v1.1 §5 + CTO Audit 2026-07-03 re-classified against DR-029. Evidence = code inspection (this session) + GPS statuses + M1 close-out. **No code modified.**
**Categories:** A = Correctly Blocked · B = Incorrectly Blocked (reopen) · C = Partially Implemented (complete now) · D = Already Compliant

---

## 1. Executive Summary

The project was healthier than the hypothesis feared: **most of the codebase already follows DR-029 avant la lettre** — the provider-adapter pattern (mock/live for payments, video, OTP, email, analytics), the `AFFILIATE_PAYOUTS_ENABLED` flag, legal-page shells, and M1's copy-slot residuals are all textbook Two-Layer engineering. **No architecture changes are needed.**

However, the audit confirms your suspicion in three places. The old philosophy caused real, unnecessary incompleteness — concentrated almost entirely in the **Affiliate experience (B1 — the largest single unlock)**, **admin tooling mislabeled "post-D-01" (B2)**, and **checkout/login UX debt mislabeled "live-provider pass" (C1)**. Roughly **10–14 dev-sessions of buildable work** was sitting behind labels that DR-029 now removes.

**Nothing in this migration reorders DR-026 phase sequence.** It re-scopes what "100%" means inside each phase.

---

## 2. Classification Register

### Category B — Incorrectly Blocked (REOPEN under DR-029)

| #   | Finding                                                                                                                                                                                                                                                                   | Old label              | Why it was wrong                                                                                                                                                                                                                                                                                                   | What to build now                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **Affiliate dashboard experience** — referral tree (3-level), wallet UI (Held vs Available), share tooling, commission history. `/dashboard/earn` today = a single "coming after review" card; referrals + wallet pages NOT STARTED, labeled "LEGAL BLOCKED / post-D-01". | LEGAL BLOCKED (D-01)   | D-01 gates **payout activation**, not the dashboard. The entire backend is DONE and tested (ledger, `wallet/{summary,withdrawal}`, `affiliate/{upline,credit,clawback}`, DR-007 rates, DR-025 hold lifecycle). Held/Available balances are REAL data. Only the Withdraw button and earn-language copy are Layer-2. | Full earn section: referral link + share (invite framing pre-D-01, copy slots per LAUNCH_CONFIG #17) · 3-level referral tree from `referredById` chain · wallet page showing real Held/Available from ledger · commission history · Withdraw button gated by `AFFILIATE_PAYOUTS_ENABLED` + designed "activation pending" state. |
| B2  | **Admin tooling labeled "post-D-01":** settings page (payouts master flag!), withdrawal review queue, rewards/popups config, webinar admin. All NOT STARTED under that label.                                                                                             | LEGAL BLOCKED / phased | These are pure platform: RBAC exists, schema exists. The settings page literally HOSTS the D-01 activation switch — it must exist BEFORE D-01 clears, not after. Withdrawal queue processes rows that can't exist until the flag flips — zero legal risk in building it.                                           | Admin settings (flags incl. `AFFILIATE_PAYOUTS_ENABLED`, contact-info config, webinar schedule config) · withdrawal review queue (empty-state designed) · webinar session admin. Stays in Phase 4 slot.                                                                                                                         |
| B3  | **KYC intake** — "Slice 2, NOT STARTED + LEGAL BLOCKED".                                                                                                                                                                                                                  | LEGAL BLOCKED          | KYC collection/encryption/admin-review is platform; only payout execution is legal-gated. PII encryption lib (existing tech-debt item) is the true prerequisite — an engineering task, not a founder decision.                                                                                                     | Phase 4: PII encryption lib (AES-256-GCM) + KYC intake form + admin KYC queue, all behind the payouts flag.                                                                                                                                                                                                                     |

### Category C — Partially Implemented (complete now)

| #   | Finding                                                                                                                                              | Old label                      | Correction                                                                                                                                                            | Completion recommendation                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Checkout + login OTP UX** — shared segmented OTP input, resend timer, failure/recovery paths, success confetti — deferred to "live-provider pass". | EXTERNAL (MSG91)               | The test OTP provider exercises the identical UI path; only final smoke-verification needs live SMS. UX was reduced for an external reason that doesn't constrain it. | Build the shared OTP component + all failure states now (against `OTP_PROVIDER=test`); re-verify (not rebuild) at live-provider switch. Clears recorded tech-debt #1 and #5 (client-side phone Zod parity). |
| C2  | **Certificate engine** — wholly deferred to Slice 1.5 because template/serial format = founder decision.                                             | Founder decision               | Engine (issuance, serial generation, `/verify/[serial]` page, `Certificate` rows) is platform; the visual template is a config slot (LAUNCH_CONFIG #14).              | Build engine + verify page in Phase 2 close or Slice 1.5 start with a neutral placeholder template clearly marked non-final.                                                                                |
| C3  | **Dashboard/admin loading skeletons + empty states** (tech-debt #4) — deferred pending spec.                                                         | Spec sequencing                | Neutral UI states are exactly what DR-029 says should always exist.                                                                                                   | Fold into Phase 2/4 module tickets as mandatory states — every page ships with loading/empty/error states, no exceptions going forward.                                                                     |
| C4  | **Day-0 Hub / registration flow** — spec drafted (v0.1) but awaiting freeze; OPEN-1/2/3 unanswered.                                                  | Founder decision (spec freeze) | Spec freeze IS a legitimate gate (DR-027 — core workflow). Not a violation; listed here so it isn't lost.                                                             | Answer OPEN-1/2/3 → freeze v1.0 → build inside Phase 2.                                                                                                                                                     |

### Category A — Correctly Blocked (no action)

| Item                                                          | Why correctly blocked                                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Recorded course content (AI + DM, previews, Lesson 0)         | The asset IS the substance; slots/player/states already built or planned. Not configurable.        |
| D-01…D-04, D-26 legal engagements                             | Real-world counsel actions, not engineering.                                                       |
| Legal page CONTENT (privacy/terms/refund/disclaimer)          | Counsel-authored text; shells + slots exist (compliant structure).                                 |
| Success stories page                                          | D-29: no real users → any content would be fabricated. Truthfulness floor, not a config.           |
| Live provider ACTIVATIONS (Razorpay/Stream/MSG91/domain/PITR) | External accounts; adapters already built both-sided.                                              |
| Guru AI Tutor (Phase 5)                                       | Needs real course transcripts (RAG corpus) — content-dependent substance + deliberate phase order. |

### Category D — Already Compliant (exemplary under DR-029)

Marketing module M1 (14 pages, copy-slot residuals) · provider adapter layer ×5 (mock/live switching) · `AFFILIATE_PAYOUTS_ENABLED` flag design · money spine + ledger · webhook/checkout backend · legal-page shell architecture · course-detail free-preview slots (`isFreePreview`) · onboarding · middleware/RBAC · analytics event layer · email receipt path.

---

## 3. Migration Report — Work-Type Split

**UI-only:** B1 earn section screens (tree/wallet/share/history) · C1 OTP component + states · C3 skeletons/empty states · B2 admin screens (mostly UI over existing data).
**Backend (small):** B1 read-queries (tree aggregation, commission history pagination) · C2 certificate issuance + serial + verify route · B3 PII encryption lib + KYC intake actions · B2 settings persistence (config table or env-admin bridge — Tier-A design choice at build).
**Documentation only:** GPS Master §5 relabeling (remove "LEGAL BLOCKED" from buildable items; statuses become IN DEVELOPMENT/NOT STARTED with LAUNCH_CONFIG refs) · CLAUDE.md build-order note ("Affiliate dashboard (gated by D-01)" → "Affiliate dashboard (payouts flag off)") · GPS-M3/M4 module specs must be written to full-build scope.
**Launch-Config-only (zero engineering):** earn-copy sets (#17) · certificate template final (#14) · webinar schedule (#27) · contact finals (#26) · all provider keys.

## 4. Prioritized Migration Backlog (effort in dev-sessions ≈ Claude Code half-days)

| Pri | Item                                                                            | Cat | Phase slot                                | Effort      | Type              |
| --- | ------------------------------------------------------------------------------- | --- | ----------------------------------------- | ----------- | ----------------- |
| 1   | Docs relabel (GPS §5 + CLAUDE.md build order + spec-scope notes)                | —   | Now                                       | 0.5         | Docs              |
| 2   | C1 OTP UX debt (shared component, states, phone Zod parity)                     | C   | Phase 2 kickoff                           | 1–2         | UI                |
| 3   | C4 Day-0 spec freeze → Hub + /register + /welcome + Lesson 0 slot               | C   | Phase 2                                   | 3–4         | UI + light schema |
| 4   | C3 loading/empty/error states policy (fold into every Phase 2+ ticket)          | C   | Continuous                                | ~0 marginal | UI                |
| 5   | B1 Full affiliate dashboard (tree, wallet, share, history, flag-gated withdraw) | B   | Phase 3 (unchanged order, expanded scope) | 4–5         | UI + small BE     |
| 6   | C2 Certificate engine + /verify page (template slot)                            | C   | Phase 2 close / Slice 1.5                 | 1.5         | BE + UI           |
| 7   | B2 Admin settings + withdrawal queue + webinar admin                            | B   | Phase 4                                   | 2–3         | UI + small BE     |
| 8   | B3 PII encryption lib + KYC intake + admin KYC queue                            | B   | Phase 4                                   | 2–3         | BE + UI           |

**Total reopened/expanded work: ~14–19 sessions** — all of it was always going to be built; DR-029 moves it from "someday, after decisions" to scheduled phase scope.

## 5. Migration Plan (systematic, preserves DR-026 order)

1. **Immediate (docs pass, Pri-1):** relabel GPS §5 + CLAUDE.md; GPS-M2/M3/M4 specs get an explicit "DR-029 scope note: build to 100% with flags/slots; only activation is gated." One session, then the register is clean.
2. **Phase 2 (LMS):** absorb Pri-2/3/4/6 into GPS-M2 spec before freeze — LMS to 100% with mock video, Hub per Day-0 spec, OTP UX debt cleared, states mandatory.
3. **Phase 3 (Affiliate):** GPS-M3 spec written to FULL dashboard scope (B1) — payouts flag off, copy slots pre-D-01. Module ends COMPLETE, not "waiting for legal."
4. **Phase 4 (Admin+KYC):** GPS-M4 spec includes B2 + B3. Module ends COMPLETE; D-01 clearance becomes a one-line flag flip + copy swap, not a build project.
5. **Launch gate:** unchanged — LAUNCH_CONFIG zero-PENDING rule (DR-029).

**Rule going forward (already in CLAUDE.md):** every close-out report checks its BLOCKED list against DR-029 — any blocker that is not architecture-class must convert to a config slot + LAUNCH_CONFIG row before the module may close.

---

**Changelog:**

- 2026-07-04 (later) — Pri-1 docs-relabel pass EXECUTED (GPS §5.4/5.5 + CLAUDE.md build order). DR-030 locked; Day-0 spec v1.0 frozen. Note: M2 close + M3 build found already underway in parallel Claude Code session — B1/B3 reopen is being absorbed there.
- 2026-07-04 — initial retroactive audit (v1.0). No code modified.
