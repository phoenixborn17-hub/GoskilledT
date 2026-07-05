import { defineConfig, devices } from "@playwright/test";

// QA-01 screenshot-harness config — SEPARATE from playwright.config.ts (the read-only public smoke
// suite) so that suite stays untouched. This one authenticates (QA sessions from
// scripts/qa-auth-bootstrap.ts) and drives every route at 3 widths. It is a capture+measure pass,
// not an assertion suite: it records mechanical budget results to docs/qa/QA-01/results.json and
// never fails the run on a budget miss (broken states are reported, not thrown).
//
//   npx tsx scripts/qa-auth-bootstrap.ts                       # once: mint sessions + fixtures
//   npx playwright test --config playwright.qa.config.ts       # capture
//   npx tsx scripts/qa-report.ts                               # build index.md + PRODUCT_DEBT rows
export default defineConfig({
  testDir: "./e2e/qa",
  testMatch: /capture\.spec\.ts/,
  fullyParallel: false,
  workers: 1, // serial: dev compiles routes lazily; avoids overlapping full-page shots + shared-DB load
  retries: 0,
  reporter: "list",
  timeout: 90_000,
  use: {
    baseURL: "http://localhost:3000",
    // Freeze animations/carets so full-page screenshots are deterministic.
    // (Applied per-shot via page.screenshot({ animations: "disabled" }) too.)
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
