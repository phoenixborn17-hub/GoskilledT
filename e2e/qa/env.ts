// Minimal .env loader for QA tsx scripts (no dotenv dependency — matches scripts/dev-simulate-webhook.ts).
// Next.js loads .env automatically for the app; standalone scripts must load it themselves.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnv(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    const quote = v[0] === '"' || v[0] === "'" ? v[0] : null;
    if (quote) {
      const end = v.indexOf(quote, 1);
      v = end === -1 ? v.slice(1) : v.slice(1, end);
    } else {
      const hash = v.search(/\s#/);
      if (hash !== -1) v = v.slice(0, hash).trim();
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

// Where the harness keeps its session state + fixtures (git-ignored).
export const AUTH_DIR = resolve(process.cwd(), "e2e", ".auth");
export const USER_STATE = resolve(AUTH_DIR, "user.json");
export const ADMIN_STATE = resolve(AUTH_DIR, "admin.json");
export const FIXTURES = resolve(AUTH_DIR, "fixtures.json");

export interface Fixtures {
  courseSlug: string | null;
  adminCourseId: string | null;
  kycUserId: string | null;
  verifySerial: string | null;
  generatedAt: string;
}
