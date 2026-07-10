# Phase C — KYC Expansion + Withdraw Flow — Module Spec v1.0 (FROZEN)

> **In-repo build spec (self-contained).** Governance source: Genesis Decision Register **DR-037** (full affiliate build, payouts OFF till written D-01), **DR-025** (held→available 48h + clawback), **DR-001** (payout day = Tuesday), plus the `Website Requirements Main` KYC/Withdraw fields. Builds on merged Phase A + B (`main` @ `9704092`). **Status: FROZEN for build.** Tier: **A** (money-out + PII) → **Fable** reviews the packet. **Do not merge — park + Review Packet; `main` touched only on the founder's relayed authorization (GATE). One session per working tree; cut `gps-phasec-kyc-withdraw` off current `main`.**

## 0. The one hard rule
**No real money leaves the system in this phase.** Phase C builds the KYC + withdrawal *request/queue/lifecycle*; **actual payout execution stays OFF behind `payoutsEnabled` (D-01) until written legal clearance.** Admin can move statuses; real disbursement integration is gated.

## 1. Goal
Complete the affiliate money-OUT path *up to* (not including) real disbursement: (a) a full **KYC** an affiliate must pass before withdrawing, and (b) a **Withdraw** request → admin queue → status lifecycle, all gated by KYC + available balance + `payoutsEnabled`.

## 2. Decisions enforced
- **DR-037 / D-01:** payouts OFF until written legal. Build everything except real disbursement.
- **DR-025:** withdrawable = *available* balance only (held→available after 48h); clawback intact.
- **DR-001:** payout cycle day = **Tuesday** (apply/process Monday → manual payout within 24h → lands Tue).
- **D-29 / PII:** no fabricated data; sensitive fields encrypted, masked on display, never logged.

## 3. C1 — KYC expansion (Tier-A · PII)
Extend the existing KYC surface (`/dashboard/earn/kyc`, `Kyc` model, AES-256-GCM `lib/pii`, masked last-4, audited) with the required fields — **additive migration only**, RLS intact:
- **Personal:** account-holder name · email + **verify** · mobile (already verified at auth) · WhatsApp number + **verify**.
- **Identity:** document-type dropdown (address proof) + **address-document upload** · **PAN-card upload** + PAN number field.
- **Bank:** bank-document upload · bank name · account-holder name · **account number** · **IFSC** · **UPI** (optional).
- **Encryption:** PAN number + account number + any doc references → existing AES-256-GCM (`lib/pii`); display masked (`maskLast4`); reveal only in admin, **logged** (extend the existing audited reveal). Never log raw PII.
- **File uploads:** store in a **private, access-controlled** bucket (Supabase Storage private) — never public URLs; access server-authorized to the owner (self) + admin; signed/short-lived access.
- **Verify flags:** email/WhatsApp verification = OTP/link; the actual send provider is **LAUNCH_CONFIG** (Layer-2) — build the flag + flow, provider config-gated. Structure `emailVerifiedAt` / `whatsappVerifiedAt`.
- **Admin KYC review (`/admin/kyc`):** show new fields masked-by-default, reveal-logged, approve/reject + reason; **KYC status gates withdrawal** (only APPROVED may withdraw).

## 4. C2 — Withdraw flow + rules (Tier-A · money)
Extend the existing withdrawal flow (`/dashboard/earn/wallet`, `Withdrawal` model with `status`/`paidAt`, single-pending, `payoutsEnabled`, ledger PAYOUT tx at admin marking) to the required rules:
- **Apply New Withdraw:** **min ₹500 · max ₹25,000**; server-enforced. Requires: **KYC APPROVED** + sufficient **available** balance (DR-025) + no existing pending (existing rule) + **`payoutsEnabled` ON** (else "coming soon" state).
- **Cycle:** requests may be submitted anytime; **payout processing cycle = Monday**, manual payout within 24h (→ Tuesday, DR-001). *(Open point §7: application anytime vs Monday-only — confirm.)*
- **Statuses:** **Applied → In Progress → Paid** (+ Rejected) + **History** tab. Map to `Withdrawal.status`.
- **Admin queue (`/admin/withdrawals`):** list requests; move Applied→In-Progress→Paid; on "Paid" the existing **ledger PAYOUT tx** fires (idempotent, balance recomputed, DR-001) — **but only when `payoutsEnabled`;** pre-D-01 this path is gated/dry (no real money integration). No real disbursement provider in this phase.

## 5. Security (Tier-A checklist)
Server-enforce every withdrawal rule (min/max/KYC/available-balance/single-pending/`payoutsEnabled`) — never trust client. PII encrypted + masked + reveal-logged; uploads private + access-authorized; no PII in logs/analytics. Ledger idempotency + clawback + amounts untouched (non-regression). Staging OTP bypass unaffected. Real prod hard-guarded.

## 6. Acceptance tests (must pass)
KYC: save encrypts PAN/account (stored ciphertext, displayed masked) ✓; email/WhatsApp verify flags set only on verify ✓; uploaded docs are private (no public URL; unauthorized fetch 403) ✓; admin reveal logged ✓; non-APPROVED KYC blocks withdrawal ✓.
Withdraw: <₹500 or >₹25k rejected server-side ✓; withdrawal blocked when KYC not approved / insufficient available / pending exists / `payoutsEnabled` OFF ✓; status lifecycle Applied→In-Progress→Paid + History ✓; **`payoutsEnabled` OFF ⇒ no real payout executes** ✓; ledger idempotency/amounts unchanged (non-regression) ✓; full suite green; tsc/lint/prettier clean.

## 7. Open points (confirm with founder — non-blocking, default stated)
- Withdrawal application: **anytime** (default) vs Monday-only. (Recommend anytime; cycle = Monday.)
- Email/WhatsApp verification provider → LAUNCH_CONFIG (which service). UPI required vs optional (default optional).
- Document-type dropdown option list (Aadhaar/DL/Voter etc.) → LAUNCH_CONFIG copy.

## 8. Out of scope
Real payout/disbursement provider integration + actual money movement (**D-01 written-legal gate**) · Leaderboard/Rewards/My-Leads (Phase D) · Admin graphs (Phase E).

## 9. Change log
- v1.0 — 2026-07-10 (Opus, steward) — frozen from Full-Functional Spec v2 Phase C + DR-037/DR-025/DR-001 + requirements KYC/Withdraw fields. Tier-A (Fable).
