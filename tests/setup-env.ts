// Load .env into process.env for tests (Prisma Client does NOT auto-load .env at runtime).
// No dotenv dependency — a minimal parser is enough for KEY="value" / KEY=value lines.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(__dirname, "..", ".env");
if (existsSync(envPath)) {
  for (const rawLine of readFileSync(envPath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
