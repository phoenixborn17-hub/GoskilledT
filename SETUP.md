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

## 6. Run
```bash
npm run test            # verify money-core
npm run dev             # http://localhost:3000
```

> Then build modules in the order in CLAUDE.md. Ask Claude Code: "Build the auth module per CLAUDE.md."
