# Auth & Provider Setup (Ticket 3)

Development runs entirely on **mock/test providers** — no live Razorpay or SMS needed.
`.env` defaults: `PAYMENT_PROVIDER=mock`, `OTP_PROVIDER=test`.

## 1. Supabase project (once)
1. supabase.com → your project → **Project Settings → API**.
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`, **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server only) in `.env`.

## 2. Phone OTP with TEST numbers (no SMS provider) — Task 1
Supabase lets you hard-code OTPs for specific numbers, so dev needs **no MSG91/Twilio**:
1. Dashboard → **Authentication → Providers → Phone** → toggle **Enable Phone provider ON**.
   (You do **not** need to configure an SMS provider for test numbers.)
2. Dashboard → **Authentication → Providers → Phone → Test OTP** (a.k.a. *Test phone numbers*).
3. Add a row: **Phone** `+919000000001`, **OTP** `123456`. Add as many as you like.
4. (Optional) In `.env` set `DEV_TEST_PHONES="9000000001"` — restricts dev OTP to your test numbers.
5. Use `9000000001` in `/checkout` or `/login`; enter `123456` as the code. `signInWithOtp` /
   `verifyOtp` run the real Supabase flow and return a real session — no SMS is sent.

Switching to production later = configure a real SMS provider in Supabase, set `OTP_PROVIDER=live`.
No app code changes.

## 3. Assign yourself the admin role — Task 4
Admin routes (`/admin/*`) require `app_metadata.role === "admin"`. Run this in the Supabase
**SQL Editor** (replace the email), then sign out/in to refresh the JWT:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'phoenixborn17@gmail.com';
-- For a phone-only account, match on phone instead:
-- where phone = '919000000001';
```

> `app_metadata` (not `user_metadata`) — users cannot edit their own `app_metadata`, so it is safe for RBAC.

## 4. Mock payment → real pipeline
In `PAYMENT_PROVIDER=mock`, checkout returns a `mock_order_…` id. Drive the exact production
pipeline (webhook → paid → enroll → HELD commission → ledger) with the signed simulator:

```bash
npm run dev                                              # in one terminal
tsx scripts/dev-simulate-webhook.ts mock_order_xxxxx 219900   # capture ₹2,199
tsx scripts/dev-simulate-webhook.ts <paymentId> 219900 refund # optional: within-window clawback
```

The script signs the payload with `RAZORPAY_WEBHOOK_SECRET` exactly like Razorpay and POSTs to
`/api/webhooks/razorpay`. There is **no alternate dev path**.
