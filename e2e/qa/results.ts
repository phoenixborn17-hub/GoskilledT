// Shared shapes + paths between the capture spec and the report generator.
import { resolve } from "node:path";
import type { Auth, Register, StateName } from "./routes";
import type { PageMetrics, BudgetLine } from "./budgets";

export const OUT_DIR = resolve(process.cwd(), "docs", "qa", "QA-01");
export const SHOTS_DIR = resolve(OUT_DIR, "shots");
export const RESULTS_JSON = resolve(OUT_DIR, "results.json");

export interface ShotResult {
  routeId: string;
  path: string; // resolved path actually navigated (or template if skipped)
  auth: Auth;
  register: Register;
  state: StateName;
  width: number;
  /** Screenshot path relative to OUT_DIR (for the index markdown), or null if not captured. */
  screenshot: string | null;
  status: "captured" | "skipped" | "error";
  skipReason?: string;
  httpStatus: number | null;
  httpOk: boolean;
  finalUrl: string | null;
  redirected: boolean;
  consoleErrors: number;
  consoleSamples: string[];
  pageError: string | null;
  metrics: PageMetrics | null;
  budgets: BudgetLine[];
  note?: string;
}

export interface RunManifest {
  generatedAt: string;
  baseURL: string;
  widths: number[];
  fixtures: Record<string, string | null>;
  results: ShotResult[];
}
