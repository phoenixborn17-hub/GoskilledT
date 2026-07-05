// QA-01 capture pass. For every route × {360,768,1280} × applicable state: load with the right QA
// session, measure the mechanical DESIGN_DIRECTION budgets, and full-page screenshot to
// docs/qa/QA-01/shots/. Writes docs/qa/QA-01/results.json for scripts/qa-report.ts.
//
// This is a CAPTURE pass, not an assertion suite — a budget miss or a broken page is RECORDED,
// never thrown. The only hard failure is a missing bootstrap (no sessions/fixtures).
import { test, expect } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import type {
  CDPSession,
  Page,
  Response as PWResponse,
} from "@playwright/test";
import {
  ROUTES,
  WIDTHS,
  type Auth,
  type RouteDef,
  type StateName,
} from "./routes";
import {
  initMetricsScript,
  readMetrics,
  scoreBudgets,
  THRESHOLDS,
  type PageMetrics,
} from "./budgets";
import { USER_STATE, ADMIN_STATE, FIXTURES, type Fixtures } from "./env";
import {
  OUT_DIR,
  SHOTS_DIR,
  RESULTS_JSON,
  type ShotResult,
  type RunManifest,
} from "./results";

// ── Preconditions ────────────────────────────────────────────────────────────────────────────
if (
  !existsSync(FIXTURES) ||
  !existsSync(USER_STATE) ||
  !existsSync(ADMIN_STATE)
) {
  throw new Error(
    "QA sessions/fixtures missing. Run `npx tsx scripts/qa-auth-bootstrap.ts` first.",
  );
}
const fixtures: Fixtures = JSON.parse(readFileSync(FIXTURES, "utf8"));
mkdirSync(SHOTS_DIR, { recursive: true });

const results: ShotResult[] = [];

const storageStateFor = (auth: Auth): string | undefined =>
  auth === "admin" ? ADMIN_STATE : auth === "user" ? USER_STATE : undefined;

/** Resolve `:key` segments from fixtures. Returns null if a required fixture is absent. */
function resolvePath(
  route: RouteDef,
  state: StateName,
): { url: string } | { skip: string } {
  if (state === "error" && route.errorPath)
    return { url: route.errorPath + (route.query ? `?${route.query}` : "") };
  let path = route.path;
  const need: Record<string, string | null> = {
    ":courseSlug": fixtures.courseSlug,
    ":adminCourseId": fixtures.adminCourseId,
    ":kycUserId": fixtures.kycUserId,
    ":verifySerial": fixtures.verifySerial,
  };
  for (const [token, value] of Object.entries(need)) {
    if (path.includes(token)) {
      if (!value) return { skip: `no fixture for ${token}` };
      path = path.replace(token, value);
    }
  }
  return { url: path + (route.query ? `?${route.query}` : "") };
}

// Slow-3G-ish profile to coax App-Router Suspense skeletons into view for loading-state shots.
async function throttle(cdp: CDPSession): Promise<void> {
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: (200 * 1024) / 8,
    uploadThroughput: (100 * 1024) / 8,
    latency: 400,
  });
}

async function measure(page: Page): Promise<PageMetrics> {
  return page.evaluate(readMetrics, THRESHOLDS.tapTargetPx);
}

function isErrorExpected(state: StateName): boolean {
  return state === "error";
}

test.describe.configure({ mode: "serial" });

test.afterAll(() => {
  const manifest: RunManifest = {
    generatedAt: new Date().toISOString(),
    baseURL: "http://localhost:3000",
    widths: [...WIDTHS],
    fixtures: {
      courseSlug: fixtures.courseSlug,
      adminCourseId: fixtures.adminCourseId,
      kycUserId: fixtures.kycUserId,
      verifySerial: fixtures.verifySerial,
    },
    results,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(RESULTS_JSON, JSON.stringify(manifest, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nQA-01: ${results.length} shots → ${RESULTS_JSON}`);
});

for (const route of ROUTES) {
  for (const state of route.states) {
    for (const width of WIDTHS) {
      test(`${route.id} · ${state} · ${width}px`, async ({ browser }) => {
        const shotName = `${route.id}__${state}__${width}.png`;
        const base: ShotResult = {
          routeId: route.id,
          path: route.path,
          auth: route.auth,
          register: route.register,
          state,
          width,
          screenshot: null,
          status: "skipped",
          httpStatus: null,
          httpOk: false,
          finalUrl: null,
          redirected: false,
          consoleErrors: 0,
          consoleSamples: [],
          pageError: null,
          metrics: null,
          budgets: [],
          note: route.note,
        };

        const resolved = resolvePath(route, state);
        if ("skip" in resolved) {
          results.push({
            ...base,
            status: "skipped",
            skipReason: resolved.skip,
          });
          test.skip(true, resolved.skip);
          return;
        }
        base.path = resolved.url;

        const context = await browser.newContext({
          storageState: storageStateFor(route.auth),
          viewport: { width, height: 900 },
          colorScheme: "light",
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();
        const consoleSamples: string[] = [];
        let consoleErrors = 0;
        let pageError: string | null = null;
        page.on("console", (m) => {
          if (m.type() !== "error") return;
          const t = m.text();
          // Exclude pure dev-tooling noise; keep real app + resource errors.
          if (/React DevTools|\[Fast Refresh\]|webpack-hmr|hot-update/i.test(t))
            return;
          consoleErrors++;
          if (consoleSamples.length < 5) consoleSamples.push(t.slice(0, 160));
        });
        page.on("pageerror", (e) => {
          pageError = e.message;
        });
        await page.addInitScript(initMetricsScript());

        let response: PWResponse | null = null;
        try {
          if (state === "loading") {
            const cdp = await context.newCDPSession(page);
            await throttle(cdp);
            response = await page.goto(resolved.url, {
              waitUntil: "commit",
              timeout: 60_000,
            });
            // Grab the skeleton before RSC data resolves under throttle.
            await page.waitForTimeout(250);
          } else {
            response = await page.goto(resolved.url, {
              waitUntil: "domcontentloaded",
              timeout: 60_000,
            });
            await page
              .waitForLoadState("networkidle", { timeout: 15_000 })
              .catch(() => {});
            await page.waitForTimeout(500); // let LCP/CLS observers settle
          }

          const httpStatus = response ? response.status() : 0;
          const httpOk = isErrorExpected(state)
            ? httpStatus < 500
            : httpStatus < 400;
          const finalUrl = page.url();
          const expectedPath = resolved.url.split("?")[0];
          const redirected = new URL(finalUrl).pathname !== expectedPath;

          const metrics = await measure(page).catch(() => null);
          const budgets = metrics
            ? scoreBudgets(metrics, THRESHOLDS, {
                httpOk,
                httpStatus,
                consoleErrors,
                pageError,
              })
            : [];

          await page.screenshot({
            path: `${SHOTS_DIR}/${shotName}`,
            fullPage: true,
            animations: "disabled",
            timeout: 30_000,
          });

          results.push({
            ...base,
            screenshot: relative(OUT_DIR, `${SHOTS_DIR}/${shotName}`).replace(
              /\\/g,
              "/",
            ),
            status: "captured",
            httpStatus,
            httpOk,
            finalUrl,
            redirected,
            consoleErrors,
            consoleSamples,
            pageError,
            metrics,
            budgets,
          });
        } catch (e) {
          results.push({
            ...base,
            status: "error",
            consoleErrors,
            consoleSamples,
            pageError:
              pageError ?? (e instanceof Error ? e.message : String(e)),
          });
        } finally {
          await context.close();
        }

        // Never fail the run on a captured shot — this is a capture pass.
        expect(true).toBe(true);
      });
    }
  }
}
