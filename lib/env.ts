// Fail-fast server env access. Never store secret fallbacks in code (Golden Rule 5).
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

/** Feature flag: affiliate payouts stay OFF until D-01 (legal). Default false. */
export function payoutsEnabled(): boolean {
  return process.env.AFFILIATE_PAYOUTS_ENABLED === "true";
}
