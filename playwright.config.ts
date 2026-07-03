import { defineConfig, devices } from "@playwright/test";

// E2E config. Uses the system-installed Google Chrome (channel: "chrome") so no Playwright browser
// download is needed. The suite is deliberately READ-ONLY (public pages only) — it never submits a
// form, so it writes nothing to the shared Supabase (integration writes are un-cleanable there).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 15_000 }, // dev compiles a route lazily on first hit — allow headroom
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
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
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
