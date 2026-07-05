import { defineConfig, devices } from "@playwright/test";

// DR-031 a11y verification config — assertion suite (unlike the capture harness, this one FAILS on a
// regression). Reuses the QA learner session from scripts/qa-auth-bootstrap.ts. Kept separate from
// playwright.config.ts (public smoke) and playwright.qa.config.ts (screenshot capture).
//
//   npx tsx scripts/qa-auth-bootstrap.ts                        # once: mint sessions + fixtures
//   npx playwright test --config playwright.a11y.config.ts
export default defineConfig({
  testDir: "./e2e/qa",
  testMatch: /guru-focus-trap\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 90_000,
  use: {
    baseURL: "http://localhost:3000",
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
