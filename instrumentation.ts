// Next.js startup hook — runs once when the server boots. We use it to validate the environment
// (lib/env.ts): hard-fail in production, warn in dev. Guarded to the Node runtime and skipped
// during `next build` (page-data collection) so it doesn't change build behavior — it runs on
// `next dev` and `next start`.
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { validateEnv } = await import("./lib/env");
    validateEnv();
  }
}
