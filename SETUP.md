# Setup (one-time)

Run these with Claude Code / a terminal in this folder.

## 1. Install deps

```bash
npm install
```

## 2. shadcn/ui (design system components)

```bash
npx shadcn@latest init        # choose: TypeScript, Tailwind, CSS variables
npx shadcn@latest add button card input dialog table badge tabs form sonner
```

## 3. Supabase (DB + Auth) — free tier

1. Create a project at supabase.com.
2. Copy the Postgres connection string → DATABASE_URL / DIRECT_URL in `.env`.
3. Copy Project URL + anon key + service_role key → `.env`.
4. Enable Phone (OTP) + Email auth in Supabase Auth settings.

## 4. Razorpay

Create keys (test mode first) → RAZORPAY_KEY_ID / SECRET; set a webhook → RAZORPAY_WEBHOOK_SECRET.

## 5. DB

```bash
npm run db:generate
npm run db:migrate      # creates tables from prisma/schema.prisma
```

## 6. Seed a full dev/staging dataset (one command)

```bash
npm run db:seed         # idempotent — safe to re-run; self-heals stray data
```

This loads everything you need to click through the product locally with **no live providers**
(`PAYMENT_PROVIDER=mock`, `OTP_PROVIDER=test`):

- **2 launch courses** (AI Prompt Mastery, Digital Marketing) — PUBLISHED, each with 2 modules × 3
  lessons and **mock video**. Titles are marked **`[PLACEHOLDER]`** — this is staging content
  standing in for the real recorded lessons (LAUNCH_CONFIG #7/#8), never presented as final.
- **5 coming-soon courses** (DR-011): Stock Market · Social Media Mastery · No-Code + AI Website
  Development · AI Content Creation · Personality Development — honest `COMING_SOON` catalog entries.
- **2 packages** (Skill Builder ₹1,499 · Career Booster ₹2,199), package↔course links, and the
  system ledger accounts.

### Verify the full founder loop (mock payments)

```bash
npm run verify:loop     # checkout → access → player → complete → certificate → verify
```

This runs the **real** money pipeline in mock mode (`startCheckout` → signed webhook →
`handleRazorpayWebhook`) and then the LMS + certificate paths, printing a ✓ at each step and a
`/verify/<serial>` link at the end. Use it to confirm the whole journey works before wiring live
providers. To later exercise a real Razorpay sandbox, add **test-mode** keys (LAUNCH_CONFIG #33).

> Clean up accumulated test rows anytime with `npm run purge:test` (dry-run by default; `--confirm`
> to delete). It never touches ledger history.

## 7. Run

```bash
npm run test            # full suite (unit + live integration)
npm run dev             # http://localhost:3000
```

## 8. QA-01 screenshot & budget harness (optional)

Captures **every route** at **360 / 768 / 1280px** in each reachable state (default · empty ·
loading · error) and scores each shot against the mechanical **DESIGN_DIRECTION v1.0** budgets
(horizontal overflow, CLS, dev-advisory LCP, tap targets, render health). Output lands in
`docs/qa/QA-01/` (`index.md` + `shots/`); broken states are auto-filed to `docs/PRODUCT_DEBT.md`.

```bash
npm run dev             # in one terminal (the harness reuses a running dev server)
npm run qa:all          # bootstrap sessions → capture → build index.md + debt rows
```

`qa:all` runs three steps you can also invoke individually:

- `npm run qa:auth` — provisions two persistent QA accounts in Supabase Auth
  (`qa-learner@goskilledqa.com`, `qa-admin@goskilledqa.com`) and **mints the admin role via SQL**
  (`auth.users.raw_app_meta_data.role = 'admin'` — the RBAC claim the middleware checks). It signs
  both in through GoTrue and captures the exact SSR session cookies into `e2e/.auth/` (git-ignored),
  plus a `fixtures.json` for the dynamic routes. Idempotent; needs no `service_role` key. The
  fresh learner account has no data, so authenticated dashboards render their genuine **empty**
  states (nothing fabricated). **Safety guard:** because it writes to the `auth` schema, it refuses
  any non-localhost project unless you set `QA_BOOTSTRAP_ALLOW=1` (acknowledging it is dev/staging),
  and it hard-blocks a configured `PRODUCTION_SUPABASE_URL` regardless — see `.env.example`.
- `npm run qa:capture` — the Playwright capture pass (`playwright.qa.config.ts`, separate from the
  read-only public smoke config). Never fails on a budget miss — it records, screenshots, and moves on.
- `npm run qa:report` — regenerates `docs/qa/QA-01/index.md` and the marker-delimited QA-01 block in
  `docs/PRODUCT_DEBT.md` (idempotent; manual debt rows untouched).

> Then build modules in the order in CLAUDE.md. Ask Claude Code: "Build the auth module per CLAUDE.md."
