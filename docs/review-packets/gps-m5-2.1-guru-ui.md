# Review Packet — GPS-M5 §2.1 Guru UI (Register 1)

**Branch:** `gps-m5-premium` · **Ticket:** GPS-M5 §2.1 (Guru UI) · **Tier:** B (for Opus review) · **Not merged.**
**Spec:** `docs/specs/GPS-M5_Premium_v1.0.md` §2.1 · **Companion:** `gps-m5-2.1-guru-ui.diff` (646 lines)
**Verification screenshots:** `docs/qa/GPS-M5/guru/` (git-ignored evidence): empty · answered(+citations) ·
blocked(D-29) · mobile bottom-sheet + desktop right-drawer.

## What was built

The Guru companion UI — "mera apna teacher" (Register 1, warm). Three surfaces, one panel:
- **Player companion panel** (`components/dashboard/guru/guru-panel.tsx`) — CSS-only **bottom-sheet on
  mobile / right-drawer on desktop** (never covers the video). Wired into the course player, context =
  the currently-viewed lesson. Deep-linkable: `?guru=1` auto-opens, `?q=` auto-asks.
- **Dashboard "Ask Guru" card** — activated the dormant AI-Mentor hub slot (`app/dashboard/page.tsx`,
  `GuruCard`); opens Guru on the learner's continue-lesson.
- **Progress "explain-my-gap" entry** (`app/dashboard/progress/page.tsx`) — deep-links to the resume
  lesson with a ready Hinglish doubt pre-asked.
- **Server action** (`app/dashboard/guru-actions.ts`) — thin boundary: auth + Zod → the parked §2.0
  engine (`askGuru`). No rules here; the client only renders verdicts.

**Full state contract (all verified live with the mock provider):** empty (warm intro + example
Hinglish chips) · typing (animated dots, `aria-live`) · answered (green bubble + gold **Lesson-N
citation chips** that jump back to the lesson) · redirected · **blocked (D-29 warm redirect — verified:
"kitna kamaunga?" → no number, no citation)** · capped · empty-corpus · error (calm bubble + Retry) ·
not-enrolled (lock + Unlock CTA).

## §19 Design-Direction v1.0 review ritual

- **Golden Rule** — improves CLARITY (doubt-solving), TRUST (cited, corpus-only, D-29), DELIGHT (warm
  typing + chips). ✓
- **Register** — Register 1 (Consumer/warm), correct for learning. Green (LMS), gold accents on
  citation chips (charcoal text — Golden Rule 14 ✓). ✓
- **Motion (§10)** — Level 1 only: press/hover, slide-in (sheet), typing dots, focus rings — all
  CSS-only and **`prefers-reduced-motion`-gated** (sheet appears instantly, dots hold still). ✓
- **States (§15)** — empty/loading/success/error all designed; no red walls (errors are calm). ✓
- **Trust (§14)** — cited answers, corpus-only, D-29 refusal all visible. ✓
- **Mobile/a11y (§18)** — 320px-first bottom sheet; touch targets ≥44px (h-11/h-14); `role="dialog"`
  `aria-modal`, chat log `role="log" aria-live="polite"`, labelled composer, focus-on-open, Esc-close. ✓
- **Consistency Test** — reuses Card/Button tokens, `.press`, `font-heading`, radius ramp; matches the
  built dashboard surfaces. ✓

**Verdict: meets Design Direction v1.0**, with three tracked follow-ups (below) — none blocking.

## Follow-ups (→ founder / PRODUCT_DEBT, not blocking)

1. **Copy is placeholder (LC #37)** — Hinglish strings incl. a few emoji in Guru's *message text*
   (conversational warmth, not UI-chrome icons); founder finalizes voice pre-launch. Flag if the emoji
   should go (§9 "no emoji-as-icon" targets UI chrome, not chat copy — judgement call).
2. **Focus-trap polish** — modal has `aria-modal` + focus-on-open + Esc; a full Tab-wrap focus trap is a
   small a11y follow-up (keyboard focus can currently reach the dimmed backdrop).
3. **Response latency in dev ~1.5–3s** — `askGuru` makes ~6 sequential remote-DB round-trips (ordered
   deliberately to short-circuit on cap/guardrail). The typing indicator masks it; a perf pass could
   parallelize the post-resolve reads. Prod pooling will help.

## Self-assessment (5 lines)

1. All nine states render correctly, verified end-to-end through the real engine + DB (mock provider).
2. D-29 guardrail confirmed **in the UI** (income question → warm redirect, zero number/citation).
3. No console/hydration errors on the player route; analytics fires verdict-only (no Q&A text — PII-safe).
4. Pure Tier-B: the action is a thin boundary over the already-parked §2.0 engine — no new Tier-A.
5. Three non-blocking follow-ups flagged (copy/emoji, focus-trap, latency); tsc + prettier clean.

## Tier-B checklist

- [x] `npm run typecheck` clean · prettier clean
- [x] Blueprint/register conformance · gold-contrast rule · mobile-first 320px
- [x] Verified on mobile + desktop viewports; `prefers-reduced-motion` respected
- [x] Screenshots captured (empty/answered/blocked, mobile+desktop)
- [x] Git commit created on branch — NOT merged (awaiting consolidated Fable pass)
