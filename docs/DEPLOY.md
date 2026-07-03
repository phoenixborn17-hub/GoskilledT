# GoSkilled — Deployment Guide (Vercel)

Step-by-step for deploying GoSkilled to production on Vercel. Written for a solo, non-developer
founder — follow it top to bottom the first time, then use the checklists for later deploys.

> **Golden rule of go-live:** the app is safe in `mock`/`test` mode and _refuses to run in
> production with dev providers_ (`lib/config/providers.ts`) and now also validates the whole
> environment at startup (`lib/env.ts` via `instrumentation.ts`). A misconfigured production deploy
> fails fast and loudly rather than silently doing the wrong thing with money.

---

## 0. Prerequisites (accounts you must own)

| Service                 | Why                      | Blocking gate       |
| ----------------------- | ------------------------ | ------------------- |
| **Vercel**              | hosting                  | —                   |
| **Supabase**            | Postgres DB + Auth (OTP) | —                   |
| **Razorpay**            | payments + webhook       | live KYC approval   |
| **MSG91**               | SMS OTP delivery         | sender/DLT approval |
| **Cloudflare Stream**   | course video (DR-022)    | —                   |
| **PostHog** (optional)  | funnel analytics         | —                   |
| Domain **goskilled.in** | production URL           | DNS access          |

---

## 1. Environment variable matrix (dev vs prod)

Set these in **Vercel → Project → Settings → Environment Variables** (scope: _Production_; add a
_Preview_/_Development_ set too if you use preview deploys). `NEXT_PUBLIC_*` are exposed to the
browser — never put secrets in a `NEXT_PUBLIC_` var. `.env.example` is the source of truth for names.

| Variable                          | Dev value               | Production value        | Needed when                  |
| --------------------------------- | ----------------------- | ----------------------- | ---------------------------- |
| `DATABASE_URL`                    | Supabase pooled URL     | Supabase pooled URL     | always                       |
| `DIRECT_URL`                      | Supabase direct URL     | Supabase direct URL     | always (migrations)          |
| `NEXT_PUBLIC_SUPABASE_URL`        | project URL             | project URL             | always                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | anon key                | anon key                | always                       |
| `SUPABASE_SERVICE_ROLE_KEY`       | service key             | service key             | always (server only)         |
| `NEXT_PUBLIC_APP_URL`             | `http://localhost:3000` | `https://goskilled.in`  | always                       |
| `PAYMENT_PROVIDER`                | `mock`                  | **`razorpay`**          | flip for go-live             |
| `RAZORPAY_KEY_ID`                 | —                       | live key id             | `PAYMENT_PROVIDER=razorpay`  |
| `RAZORPAY_KEY_SECRET`             | —                       | live key secret         | `PAYMENT_PROVIDER=razorpay`  |
| `RAZORPAY_WEBHOOK_SECRET`         | —                       | webhook secret (see §4) | `PAYMENT_PROVIDER=razorpay`  |
| `OTP_PROVIDER`                    | `test`                  | **`live`**              | flip for go-live             |
| `MSG91_AUTH_KEY`                  | —                       | MSG91 auth key          | `OTP_PROVIDER=live`          |
| `VIDEO_PROVIDER`                  | `mock`                  | **`stream`**            | flip for go-live             |
| `CLOUDFLARE_STREAM_CUSTOMER_CODE` | —                       | customer code           | `VIDEO_PROVIDER=stream`      |
| `ANALYTICS_PROVIDER`              | `console`               | `console` or `posthog`  | optional                     |
| `POSTHOG_API_KEY`                 | —                       | project key             | `ANALYTICS_PROVIDER=posthog` |
| `POSTHOG_HOST`                    | —                       | region host (optional)  | `ANALYTICS_PROVIDER=posthog` |
| `PII_ENCRYPTION_KEY`              | any 32-byte base64      | **real 32-byte base64** | always in prod (KYC)         |
| `AFFILIATE_PAYOUTS_ENABLED`       | `false`                 | **`false` until D-01**  | legal gate                   |

**The three go-live flips** (`PAYMENT_PROVIDER`, `OTP_PROVIDER`, `VIDEO_PROVIDER`) each require their
credentials in the same table row. If you flip a provider without its keys, the startup env
validation lists exactly what's missing and the deploy fails — that's intended.

Generate `PII_ENCRYPTION_KEY` once and store it in a password manager (rotating it makes existing
encrypted PII unreadable):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 2. First deploy

1. Push the repo to GitHub and **Import Project** in Vercel (framework auto-detected as Next.js).
2. Add all Production env vars from §1 (start in **safe mode**: providers still `mock/test/mock` if
   you want a smoke test, or full production values to go live).
3. Deploy. Vercel runs `next build`. If the build/boot fails with a `FATAL: environment validation
failed` or `development providers enabled in production` message, fix the listed vars and redeploy.
4. Run database migrations against the production DB (from your machine, with prod `DATABASE_URL`
   and `DIRECT_URL` exported):
   ```bash
   npx prisma migrate deploy
   ```
5. Seed the catalog if this is a fresh DB: `npm run db:seed`.
6. Set the **admin role** on your Supabase auth user (see `docs/AUTH_SETUP.md` / `SETUP.md` for the
   SQL that sets `app_metadata.role = "admin"`).

---

## 3. Supabase — backups (PITR)

Enable **Point-in-Time Recovery** in Supabase → Database → Backups **before taking real payments**.
The ledger is append-only and money-critical; PITR lets you restore to any second if something goes
wrong. Note the retention window your plan provides and treat it as your recovery SLA.

---

## 4. Razorpay webhook configuration

Commissions credit **only** from a signature-verified Razorpay webhook (Golden Rule 2) — this must
be configured or paid orders will never activate.

1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**.
2. **URL:** `https://goskilled.in/api/webhooks/razorpay`
3. **Secret:** generate a strong random string; set it **both** here and as
   `RAZORPAY_WEBHOOK_SECRET` in Vercel (they must match — the route verifies the signature before
   parsing the body).
4. **Active events:** at minimum `payment.captured` and `payment.failed` (add `refund.processed`
   for the refund/clawback path).
5. Save, then use Razorpay's "Send test webhook" and confirm a `WebhookEvent` row appears and the
   order flips to `PAID`. The webhook route is excluded from auth middleware by design (raw-body,
   signature-checked).

---

## 5. Domain (goskilled.in)

1. Vercel → Project → **Settings → Domains → Add** `goskilled.in` (and `www.goskilled.in`).
2. At your registrar, add the DNS records Vercel shows (usually an `A` record for the apex and a
   `CNAME` for `www`). Choose one canonical host and redirect the other.
3. Wait for DNS + TLS to go green, then set `NEXT_PUBLIC_APP_URL=https://goskilled.in` and redeploy
   (canonical URLs, OG tags, sitemap, and the Razorpay webhook URL all depend on it).

---

## 6. Rollback

Vercel keeps every deployment. To roll back:

1. Vercel → Project → **Deployments**.
2. Find the last known-good deployment → **⋯ → Promote to Production** (instant; no rebuild).

**Caveat:** a rollback reverts _code_, not the _database_. If a bad deploy also ran a migration,
roll the code back **and** restore the DB via Supabase PITR (§3) to the pre-migration point. Never
hand-edit `LedgerTransaction`/`LedgerEntry` — they are append-only; correct money issues with a new
compensating transaction, not a delete.

---

## Pre-go-live checklist

- [ ] All Production env vars set; `PAYMENT_PROVIDER=razorpay`, `OTP_PROVIDER=live`, `VIDEO_PROVIDER=stream` with real credentials
- [ ] `PII_ENCRYPTION_KEY` is a real 32-byte base64 key, stored safely
- [ ] `AFFILIATE_PAYOUTS_ENABLED=false` (until legal gate D-01 clears)
- [ ] `npx prisma migrate deploy` run against prod DB; catalog seeded
- [ ] Supabase PITR enabled
- [ ] Razorpay webhook added, secret matches `RAZORPAY_WEBHOOK_SECRET`, test event verified → `PAID`
- [ ] `goskilled.in` domain live with TLS; `NEXT_PUBLIC_APP_URL` updated
- [ ] Admin role set on the founder's Supabase user
- [ ] A real ₹ test purchase end-to-end (or Razorpay test mode) confirms: pay → webhook → enroll → HELD commission
