# GoSkilled vNext

Production rebuild of the GoSkilled learn-and-earn platform. Greenfield (DR-019); legacy
`../goskilled-web` is reference/archive only. Built by a solo founder + Claude Code (DR-020).

**Stack:** Next.js 15 · TypeScript · Tailwind + shadcn/ui · Postgres (Supabase) + Prisma ·
Supabase Auth · Razorpay (webhook-verified) · double-entry ledger · Zod · Vitest + Playwright · Vercel.

See `CLAUDE.md` for the golden rules + module build order, and `SETUP.md` to run it.
Architecture rationale: `../Genesis/03_Canonical_KB/domains/KB-14_Technology/vNext_Architecture_Decision_Record_v1_2026-07-03.md`.

## Quick start

```bash
npm install
cp .env.example .env      # fill in Supabase + Razorpay keys
npm run db:generate
npm run db:migrate
npm run test              # money-core tests should pass
npm run dev
```
