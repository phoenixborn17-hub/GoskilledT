// Server env access + a full Zod env schema validated at startup.
// Never store secret fallbacks in code (Golden Rule 5). Enforcement mirrors the provider guard:
// hard-fail in production, warn-only in dev (so a laptop without prod secrets still boots).
import { z } from "zod";

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

/** Feature flag: affiliate payouts stay OFF until D-01 (legal). Default false. */
export function payoutsEnabled(): boolean {
  return process.env.AFFILIATE_PAYOUTS_ENABLED === "true";
}

// ── Env schema ──────────────────────────────────────────────────────────────
// Base infrastructure the app cannot run without is always required. Provider secrets are
// required CONDITIONALLY on the selected provider (mock/test/console dev modes need none), and a
// few keys are required only in production. Kept as a pure schema so it's unit-testable without
// touching the real environment.
const NON_EMPTY = z.string().trim().min(1);

export const EnvSchema = z
  .object({
    // Database (Supabase Postgres)
    DATABASE_URL: NON_EMPTY,
    DIRECT_URL: NON_EMPTY,
    // Supabase Auth
    NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: NON_EMPTY,
    SUPABASE_SERVICE_ROLE_KEY: NON_EMPTY,
    // Provider selectors — optional (defaults live in lib/config/providers.ts) but must be valid.
    PAYMENT_PROVIDER: z.enum(["mock", "razorpay"]).optional(),
    OTP_PROVIDER: z.enum(["test", "live"]).optional(),
    VIDEO_PROVIDER: z.enum(["mock", "stream"]).optional(),
    ANALYTICS_PROVIDER: z.enum(["console", "posthog"]).optional(),
    EMAIL_PROVIDER: z.enum(["console", "resend"]).optional(),
    AI_PROVIDER: z.enum(["mock", "live"]).optional(), // Guru (GPS-M5) — default mock
    // App
    NEXT_PUBLIC_APP_URL: z.string().trim().url().optional(), // has a localhost default in lib/seo.ts
    // Deployment mode. Only `staging` carries behaviour: on a NON-prod host it lets a production
    // build boot with mock providers (see lib/config/providers.ts isStagingMode). Money-rail logic
    // lives there, not here — this entry just validates the value + documents the var.
    APP_ENV: z.enum(["development", "staging", "production"]).optional(),
    AFFILIATE_PAYOUTS_ENABLED: z.enum(["true", "false"]).optional(),
    D01_LEGAL_CLEARED: z.enum(["true", "false"]).optional(), // LC #1 gate for the payout-flag ceremony

    // Provider secrets (conditionally required below)
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
    CLOUDFLARE_STREAM_CUSTOMER_CODE: z.string().optional(),
    POSTHOG_API_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_UNSUBSCRIBE_SECRET: z.string().optional(), // HMAC key for unsubscribe links — required in prod
    ANTHROPIC_API_KEY: z.string().optional(), // required when AI_PROVIDER=live (Guru, LC #35)
    MSG91_AUTH_KEY: z.string().optional(),
    // Guru cost caps (GPS-M5 §2.0, LC #36) — optional; safe numeric defaults live in modules/ai/guru/caps.ts.
    GURU_DAILY_MSG_CAP: z.string().optional(),
    GURU_DAILY_TOKEN_BUDGET: z.string().optional(),
    PII_ENCRYPTION_KEY: z.string().optional(),
    NODE_ENV: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    const isProd = env.NODE_ENV === "production";
    const require = (key: keyof typeof env, when: string) => {
      if (!env[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key as string],
          message: `${key} is required ${when}`,
        });
      }
    };

    // Provider-conditional secrets (apply in any environment once the real provider is selected).
    if ((env.PAYMENT_PROVIDER ?? "mock") === "razorpay") {
      require("RAZORPAY_KEY_ID", "when PAYMENT_PROVIDER=razorpay");
      require("RAZORPAY_KEY_SECRET", "when PAYMENT_PROVIDER=razorpay");
      require("RAZORPAY_WEBHOOK_SECRET", "when PAYMENT_PROVIDER=razorpay");
    }
    if ((env.OTP_PROVIDER ?? "test") === "live") {
      require("MSG91_AUTH_KEY", "when OTP_PROVIDER=live");
    }
    if ((env.VIDEO_PROVIDER ?? "mock") === "stream") {
      require("CLOUDFLARE_STREAM_CUSTOMER_CODE", "when VIDEO_PROVIDER=stream");
    }
    if ((env.ANALYTICS_PROVIDER ?? "console") === "posthog") {
      require("POSTHOG_API_KEY", "when ANALYTICS_PROVIDER=posthog");
    }
    if ((env.EMAIL_PROVIDER ?? "console") === "resend") {
      require("RESEND_API_KEY", "when EMAIL_PROVIDER=resend");
    }
    if ((env.AI_PROVIDER ?? "mock") === "live") {
      require("ANTHROPIC_API_KEY", "when AI_PROVIDER=live");
    }

    // Production-only requirements.
    if (isProd) {
      require("PII_ENCRYPTION_KEY", "in production (PII/KYC encryption)");
      // Unsubscribe links are HMAC-signed; prod MUST set a dedicated key so it never silently
      // derives from DATABASE_URL (whose rotation would break every outstanding link).
      require("EMAIL_UNSUBSCRIBE_SECRET", "in production (unsubscribe-link HMAC key)");
    }

    // Format check: PII_ENCRYPTION_KEY must be a 32-byte base64 key (AES-256-GCM) if present.
    if (env.PII_ENCRYPTION_KEY) {
      let bytes = 0;
      try {
        bytes = Buffer.from(env.PII_ENCRYPTION_KEY, "base64").length;
      } catch {
        bytes = -1;
      }
      if (bytes !== 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["PII_ENCRYPTION_KEY"],
          message:
            "PII_ENCRYPTION_KEY must be a base64-encoded 32-byte key (AES-256-GCM)",
        });
      }
    }
  });

/** Pure: list of human-readable problems with the given env (empty = valid). Unit-testable. */
export function envIssues(env: NodeJS.ProcessEnv = process.env): string[] {
  const result = EnvSchema.safeParse(env);
  if (result.success) return [];
  return result.error.issues.map((i) => {
    const key = i.path.join(".") || "(root)";
    return `${key}: ${i.message}`;
  });
}

/**
 * Validate env at startup. Hard-fails in production (so a misconfigured deploy never serves a
 * broken/insecure app); warns-only elsewhere so a dev machine without prod secrets still boots.
 * Mirrors assertProductionProviderSafety's philosophy. `env` is injectable for tests.
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): void {
  const issues = envIssues(env);
  if (issues.length === 0) return;
  const detail = issues.map((i) => `  • ${i}`).join("\n");
  if (env.NODE_ENV === "production") {
    throw new Error(
      `FATAL: environment validation failed — ${issues.length} problem(s):\n${detail}\n` +
        `Set the missing/invalid variables (see .env.example) before deploying.`,
    );
  }
  console.warn(
    `[env] ${issues.length} environment problem(s) — continuing in ${env.NODE_ENV ?? "development"} mode, ` +
      `but these MUST be fixed before production:\n${detail}`,
  );
}
