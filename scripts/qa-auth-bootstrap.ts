// QA-01 auth bootstrap — produces the two sessions the screenshot harness needs and the fixtures
// its dynamic routes resolve, WITHOUT hand-rolling any auth surface in the APP (DR-024: Supabase
// Auth stays the one authority; sign-in still goes through GoTrue). This staging project has no
// service_role key in .env, so the accounts are provisioned directly in the Supabase `auth` schema
// over the same Postgres connection the app owns — the documented SETUP.md ceremony, done in code:
//   1. ensure two dedicated QA accounts exist in auth.users (+ auth.identities), email pre-confirmed,
//      bcrypt password set via pgcrypto — idempotent, re-runnable;
//   2. MINT the admin role in raw_app_meta_data (Supabase surfaces it as app_metadata → middleware RBAC);
//   3. sign both in through @supabase/ssr (real GoTrue password grant) so the EXACT SSR cookies the
//      app reads are captured into Playwright storageState;
//   4. write fixtures.json (course slug/id + a KYC userId / certificate serial if any exist).
//
// These are PERSISTENT QA fixtures (real UUID ids), not throwaway test rows — scripts/purge-test-data
// won't (and shouldn't) sweep them. Dev/staging only.
//
//   npx tsx scripts/qa-auth-bootstrap.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { PrismaClient } from "../lib/generated/prisma";
import {
  loadEnv,
  AUTH_DIR,
  USER_STATE,
  ADMIN_STATE,
  FIXTURES,
  type Fixtures,
} from "../e2e/qa/env";

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!URL || !ANON) {
  throw new Error(
    "QA bootstrap needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.",
  );
}
if (process.env.NODE_ENV === "production") {
  throw new Error(
    "qa-auth-bootstrap is a dev/staging tool — never run in production.",
  );
}

/**
 * Target-project safety guard. This script WRITES into Supabase's `auth` schema (mints a QA admin),
 * so `NODE_ENV !== 'production'` is not enough — a dev NODE_ENV pointed at the prod project would
 * mint an admin in production. Refuse fast unless the target is provably non-prod:
 *   1. HARD block if the target host equals a configured PRODUCTION_SUPABASE_URL (never overridable).
 *   2. Allow localhost (a local Supabase).
 *   3. Any other remote host requires an explicit acknowledgement — either it matches a pinned
 *      QA_STAGING_SUPABASE_URL, or QA_BOOTSTRAP_ALLOW=1 is set to confirm "yes, this is my dev/staging".
 */
function assertNonProdTarget(rawUrl: string): void {
  const host = new global.URL(rawUrl).host;

  const prod = process.env.PRODUCTION_SUPABASE_URL;
  if (prod && new global.URL(prod).host === host) {
    throw new Error(
      `FATAL: qa-auth-bootstrap target (${host}) is PRODUCTION_SUPABASE_URL. ` +
        `This tool mints a QA admin via SQL and must NEVER touch production.`,
    );
  }

  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return;

  const pinned = process.env.QA_STAGING_SUPABASE_URL;
  if (pinned && new global.URL(pinned).host === host) return;

  if (process.env.QA_BOOTSTRAP_ALLOW === "1") return;

  throw new Error(
    `FATAL: refusing to write auth rows to non-localhost Supabase project "${host}". ` +
      `Safety guard: if this IS your dev/staging project, acknowledge with QA_BOOTSTRAP_ALLOW=1 ` +
      `(or pin QA_STAGING_SUPABASE_URL). Never point this at production.`,
  );
}
assertNonProdTarget(URL);

// Fixed, obviously-synthetic QA identities (normal TLD so GoTrue's login-side validation accepts them).
const QA_PASSWORD = "QaScreenshots!2026";
const USERS = {
  user: { email: "qa-learner@goskilledqa.com", role: null as string | null },
  admin: { email: "qa-admin@goskilledqa.com", role: "admin" },
} as const;

const prisma = new PrismaClient();

const appMeta = (role: string | null) =>
  JSON.stringify(
    role
      ? { provider: "email", providers: ["email"], role }
      : { provider: "email", providers: ["email"] },
  );

/**
 * Provision (or refresh) a confirmed email+password account entirely via SQL in the auth schema.
 * Idempotent: creates the auth.users + auth.identities rows on first run, and on every run resets
 * the password + confirmation + app_metadata so the account is always in a known-good state.
 * Returns the user id.
 */
async function ensureAccount(
  email: string,
  role: string | null,
): Promise<string> {
  const meta = appMeta(role);

  // 1) Create the user if absent (crypt/gen_salt live in the `extensions` schema on Supabase).
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `WITH existing AS (
       SELECT id FROM auth.users WHERE email = $1 AND deleted_at IS NULL LIMIT 1
     ), ins AS (
       INSERT INTO auth.users (
         instance_id, id, aud, role, email, encrypted_password,
         email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
         confirmation_token, recovery_token, email_change_token_new, email_change
       )
       SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
              'authenticated', $1, extensions.crypt($2, extensions.gen_salt('bf')),
              now(), $3::jsonb, '{}'::jsonb, now(), now(),
              '', '', '', ''
       WHERE NOT EXISTS (SELECT 1 FROM existing)
       RETURNING id
     )
     SELECT id::text AS id FROM ins
     UNION ALL
     SELECT id::text AS id FROM existing`,
    email,
    QA_PASSWORD,
    meta,
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`ensureAccount(${email}) produced no id`);

  // 2) Always refresh password + confirmation + metadata (role mint happens here for admin).
  await prisma.$executeRawUnsafe(
    `UPDATE auth.users
       SET encrypted_password = extensions.crypt($2, extensions.gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           raw_app_meta_data = $3::jsonb,
           updated_at = now(),
           -- GoTrue scans these into non-nullable Go strings; NULLs cause a 500 on login.
           confirmation_token = COALESCE(confirmation_token, ''),
           recovery_token = COALESCE(recovery_token, ''),
           email_change_token_new = COALESCE(email_change_token_new, ''),
           email_change = COALESCE(email_change, '')
     WHERE id = $1::uuid`,
    id,
    QA_PASSWORD,
    meta,
  );

  // 3) Ensure the email identity exists (modern GoTrue requires it for password sign-in).
  // `auth.identities.email` is a generated column (derived from identity_data->>'email') — omit it.
  await prisma.$executeRawUnsafe(
    `INSERT INTO auth.identities
       (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
     SELECT $1, $2::uuid,
            jsonb_build_object('sub', $1, 'email', $3, 'email_verified', true, 'phone_verified', false),
            'email', now(), now(), now()
     WHERE NOT EXISTS (
       SELECT 1 FROM auth.identities WHERE provider = 'email' AND user_id = $2::uuid
     )`,
    id,
    id,
    email,
  );

  return id;
}

interface PwCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax" | "Strict" | "None";
}

/**
 * Sign a QA user in through @supabase/ssr with an in-memory cookie jar, capturing the library's own
 * cookie encoding (chunked as `sb-…-auth-token.0/.1` when large). Returns Playwright cookies bound
 * to localhost over http (secure forced off — local dev target).
 */
async function captureSessionCookies(email: string): Promise<PwCookie[]> {
  const jar = new Map<string, string>();
  const ssr = createServerClient(URL, ANON, {
    cookies: {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll: (list: { name: string; value: string }[]) => {
        for (const { name, value } of list) {
          if (value === "") jar.delete(name);
          else jar.set(name, value);
        }
      },
    },
  });
  const { error } = await ssr.auth.signInWithPassword({
    email,
    password: QA_PASSWORD,
  });
  if (error) throw new Error(`signIn(${email}) failed: ${error.message}`);
  if (jar.size === 0) throw new Error(`signIn(${email}) set no cookies`);

  const oneYear = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;
  return Array.from(jar, ([name, value]) => ({
    name,
    value,
    domain: "localhost",
    path: "/",
    expires: oneYear,
    httpOnly: false,
    secure: false,
    sameSite: "Lax" as const,
  }));
}

function writeState(file: string, cookies: PwCookie[]): void {
  writeFileSync(file, JSON.stringify({ cookies, origins: [] }, null, 2));
}

async function resolveFixtures(): Promise<Fixtures> {
  // Prefer the canonical seed courses (clean [PLACEHOLDER] content) over any stray integration-test
  // course that happens to be published; fall back to the first published course if neither exists.
  const course =
    (await prisma.course.findFirst({
      where: {
        status: "PUBLISHED",
        slug: { in: ["ai-prompt-mastery", "digital-marketing"] },
      },
      orderBy: { order: "asc" },
      select: { id: true, slug: true },
    })) ??
    (await prisma.course.findFirst({
      where: { status: "PUBLISHED", slug: { not: "getting-started" } },
      orderBy: { order: "asc" },
      select: { id: true, slug: true },
    }));
  const kyc = await prisma.kyc.findFirst({
    where: { submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    select: { userId: true },
  });
  const cert = await prisma.certificate.findFirst({
    orderBy: { issuedAt: "desc" },
    select: { serial: true },
  });
  return {
    courseSlug: course?.slug ?? null,
    adminCourseId: course?.id ?? null,
    kycUserId: kyc?.userId ?? null,
    verifySerial: cert?.serial ?? null,
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  mkdirSync(AUTH_DIR, { recursive: true });

  console.log("QA bootstrap →", URL);
  const userId = await ensureAccount(USERS.user.email, USERS.user.role);
  const adminId = await ensureAccount(USERS.admin.email, USERS.admin.role);
  console.log(
    `  ✓ accounts ready (user=${userId.slice(0, 8)}… admin=${adminId.slice(0, 8)}…)`,
  );
  console.log("  ✓ admin role minted via SQL (raw_app_meta_data.role = admin)");

  writeState(USER_STATE, await captureSessionCookies(USERS.user.email));
  writeState(ADMIN_STATE, await captureSessionCookies(USERS.admin.email));
  console.log("  ✓ storageState captured → e2e/.auth/{user,admin}.json");

  const fixtures = await resolveFixtures();
  writeFileSync(FIXTURES, JSON.stringify(fixtures, null, 2));
  console.log("  ✓ fixtures →", JSON.stringify(fixtures));

  console.log(
    "\nBootstrap complete. Run: npx playwright test --config playwright.qa.config.ts",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("\nBootstrap failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
