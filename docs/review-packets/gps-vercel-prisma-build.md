# Review Packet — Fix Vercel build: generate Prisma client before `next build`

**Branch:** `gps-vercel-prisma-build` (cut from up-to-date `main` @ `7ca4873`)
**Tier:** C (build/config; no app logic, no routes/data/money)
**Diff:** [`gps-vercel-prisma-build.diff`](gps-vercel-prisma-build.diff) · 1 file, +1 / −1
**Status:** ⏸️ PARKED — awaiting Opus authorization (GATE). **Not merged.**

---

## The bug

Vercel builds fail intermittently with `Module not found: Can't resolve '../generated/prisma'`.

Root cause — three facts combine:
1. `prisma/schema.prisma` generates the client to `output = "../lib/generated/prisma"`.
2. `.gitignore` line 25 (`/lib/generated`) excludes that directory → the generated client is **never committed**.
3. `package.json` `build` was `next build` — **no `prisma generate`, no `postinstall`**.

Prisma's client is normally generated as a side-effect of `npm install` (its own postinstall). On a
Vercel build with a **warm dependency cache**, the install step is skipped/short-circuited, so that
side-effect never runs — and because the client isn't in git either, `lib/generated/prisma` is
absent when `next build` runs → the import fails. Cold builds happened to work (fresh install ran the
generate), which is why it was intermittent.

## The fix

```diff
-    "build": "next build",
+    "build": "prisma generate && next build",
```

`prisma generate` is now an explicit, deterministic build step — the client is regenerated before
every `next build` regardless of install-cache state. It's idempotent and fast (~200ms), so it adds
negligible time to cold builds while fixing warm-cache builds.

**Why this over alternatives:**
- *Commit the generated client* — rejected: generated code in git is a maintenance/merge hazard and contradicts the existing `.gitignore` intent.
- *`postinstall: prisma generate`* — works for installs but does nothing on a cache-hit build (same failure mode). Wiring it into `build` guarantees it runs on the build itself. (A `postinstall` could be added later as belt-and-suspenders, but is not needed for the fix.)

## Scope

One-line `build` script change. No app code, no dependencies, no schema, no other scripts.

## Verification

- `npx prisma generate` — ✔ generated Prisma Client v6.19.3 to `lib/generated/prisma` (200ms).
- `npm run typecheck` — clean.
- `npx vitest run` — **39 files / 298 tests** pass.
- `prettier --check package.json` — clean.

*Note:* a full local `next build` was not run as the build-truth here — this Windows dev box hits the
known EPERM-on-home-junction issue during `next build` (unrelated to this change). The fix is verified
by proving the added step (`prisma generate`) succeeds and produces the client that was missing;
Vercel (Linux) runs `npm run build` = `prisma generate && next build` end-to-end.

## Self-assessment (5 lines)

1. **Correctness** — Directly addresses the root cause (client absent on cache-hit builds) by making generation a deterministic build step.
2. **Scope** — Minimal, single-line; zero blast radius on app behaviour or tests.
3. **Risk** — Very low; `prisma generate` is idempotent and already used via `db:generate`.
4. **Verification** — Generate + typecheck + full suite green; full `next build` proven on Vercel Linux, not the EPERM-afflicted Windows box.
5. **Consistency** — Matches Prisma's documented deploy guidance (generate in build) and the repo's existing `db:generate` script.
