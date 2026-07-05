# Review Packet — GPS-M5 §2.7 Shareable certificate card (Tier B)

**Branch:** `gps-m5-premium` · **Ticket:** GPS-M5 §2.7 · **Tier:** B · **NOT merged.**
**Spec:** `docs/specs/GPS-M5_Premium_v1.0.md` §2.7 · **Companion:** `gps-m5-2.7-share-card.diff` (247 lines).
**Verification shots:** `docs/qa/GPS-M5/share/` (git-ignored): OG image · verify-page share button.

## What was built

Compliant social-proof sharing for a verified certificate (D-29: pride, never earnings).
- **Dynamic OG image** (`app/verify/[serial]/opengraph-image.tsx`, `next/og`): when a `/verify/<serial>`
  link is shared, platforms render a branded card — GoSkilled mark · CERTIFICATE OF COMPLETION · learner
  name · course · serial + issue date · gold "Verified credential" badge. **Invalid serial → neutral
  brand fallback** (never fabricated data). Next auto-wires it as the page's `og:image`.
- **Share button** (`ShareCertButton`, client): **Web Share API** (native sheet) where available, else a
  **`wa.me` deep-link** (India's default channel). On the **verify page** (anyone viewing) and the
  **progress certificate card** (the earner). No PII beyond the public verify URL.

## §19 Design-Direction v1.0 review ritual

- Register 1 (pride moment) / Register 2 on verify (calm proof). Gold badge = fill + charcoal (Rule 14). ✓
- Trust (§14): the verify page already carries serial + issue date + anti-fake framing; the share card
  reinforces it. ✓
- States: valid → full card + share; invalid serial → neutral fallback (no fake data). ✓
- **Verdict: meets Design Direction v1.0.**

## Verified in-browser

OG image renders at 1200×630 (`200 image/png`) — premium brand card (screenshot). Verify page shows the
"Share certificate" button. `tsc` + prettier clean. (Satori note: dropped a non-Latin glyph + added
explicit `display:flex` on every multi-child node — the two `next/og` gotchas — now renders cleanly.)

## Self-assessment (5 lines)

1. OG image reuses the already-tested `getCertificateBySerial`; invalid serials never leak/fabricate.
2. Share degrades gracefully (Web Share → WhatsApp) — works on desktop + mobile.
3. D-29-safe throughout (a credential, never income); gold-contrast rule honored.
4. No new tested logic (declarative UI + rendering) — full suite still green; nothing broke.
5. Reused the verify serial as the shareable token (public by design — the page is already public).

## Tier-B checklist
- [x] `tsc` clean · prettier clean · full suite green (nothing broke)
- [x] OG image + share button verified in-browser
- [x] D-29-safe · gold-contrast rule · invalid-serial fallback (no fabricated data)
- [x] Git commit created on branch — NOT merged (awaiting consolidated Fable PASS)
