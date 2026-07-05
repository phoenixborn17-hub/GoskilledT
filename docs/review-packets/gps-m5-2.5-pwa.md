# Review Packet — GPS-M5 §2.5 PWA shell (Tier B)

**Branch:** `gps-m5-premium` · **Ticket:** GPS-M5 §2.5 · **Tier:** B · **NOT merged.**
**Spec:** `docs/specs/GPS-M5_Premium_v1.0.md` §2.5 · **Companion:** `gps-m5-2.5-pwa.diff` (370 lines, icons binary).
**Verification shots:** `docs/qa/GPS-M5/pwa/` (git-ignored): custom install prompt.

## What was built

Installable app shell + offline fallback, with a **security-first** service worker.

- **Manifest** (`app/manifest.ts`, Next auto-injects the link): standalone, `start_url:/dashboard`,
  theme `#137E49`, icons 192/512/**maskable**.
- **Icons** (`public/icons/*.png`, generated via sharp): placeholder green "G" mark (LC #40 — final =
  founder logo).
- **Service worker** (`public/sw.js`) — **the security piece**:
  - Caches ONLY immutable static assets (`/_next/static/*`, `/icons/*`, favicon) + a static offline page.
  - **Navigations are network-first and NEVER written to cache** (a page could be authed).
  - **API + all user-specific requests → straight to network, never cached** (no `respondWith`).
  - Non-GET → untouched. "If in doubt, do not cache" — a shared device can never serve one user's page
    to another.
- **Offline fallback** (`public/offline.html`): static, branded, no PII, no JS dependency.
- **Registration** (`PwaRegister`): **production-only** (a SW fights Next HMR in dev) + after `load`
  (LCP-safe).
- **Custom install prompt** (`InstallPrompt`, Register 1): shows **after the first lesson** (eligible =
  ≥1 completed lesson, computed in the dashboard layout) — **never on landing**; captures
  `beforeinstallprompt`, premium dismissible banner, one-time dismissal, reduced-motion-safe (`.enter`).

## Security review (the hard rule)

- The SW's `isCacheableStatic()` allowlist is content-hashed immutable assets only — no HTML, no `/api/*`,
  no authed route, no cross-origin. Navigation responses are never `put()` into any cache. Verified by
  reading every branch of the fetch handler: the only `caches.*.put` is inside `isCacheableStatic`.
- No PII, money, or auth response is cacheable by construction.

## Verified

- Artifacts served correctly (dev): `/manifest.webmanifest` (valid, standalone, 3 icons), `/sw.js`
  (`application/javascript`), `/offline.html`, all icons (`image/png`) — all `200`.
- Custom install prompt renders on the dashboard after a completed lesson (screenshot) — premium banner,
  Install + dismiss, not on landing.
- Production build **compiles successfully**; SW registration is prod-gated.

## Known limitations (non-blocking)

- **Live Lighthouse "installable" + offline-fallback run is deferred to a real deployment.** A local
  `next build` can't boot because the **production provider guard** intentionally FATALs on mock
  providers (`PAYMENT_PROVIDER=mock` etc.) — a pre-existing env constraint, unrelated to §2.5 (the PWA
  code compiled successfully). The manifest, SW, icons, and offline page are all validated as served.
- App icon is a placeholder mark (LC #40).

## Self-assessment (5 lines)

1. The SW is deliberately minimal + allowlist-only; I audited every path — nothing user-specific is cacheable.
2. Install prompt is correctly gated (post-first-lesson, not landing) + reduced-motion safe + dismissible.
3. SW is production-only so it never destabilises dev; registration is post-load (LCP-safe).
4. Full Lighthouse deferred to deploy (local prod build blocked by the mock-provider guard — pre-existing).
5. Icons are placeholders (LC #40); everything else is production-ready.

## Tier-B checklist

- [x] `tsc` clean · prettier clean · full suite 256/35 green (PWA is declarative; nothing broke)
- [x] Manifest + SW + icons + offline served correctly (verified)
- [x] SECURITY: SW caches static/shell only — never authed pages / API / PII (code-audited)
- [x] Install prompt post-first-lesson, not on landing; reduced-motion safe
- [x] Git commit created on branch — NOT merged (awaiting consolidated Fable PASS)
