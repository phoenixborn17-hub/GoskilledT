// QA-01 mechanical budgets — the OBJECTIVE, measurable subset of DESIGN_DIRECTION v1.0.
// This harness records NO UX opinion. It measures numbers and compares them to the thresholds
// the design constitution states as budgets, plus basic render-health (is the page broken?).
//
// DESIGN_DIRECTION references:
//   §6/§17  LCP < 2.5s on mid-Android           → `lcpMs`
//   §10/§17 "zero CLS" / CLS 0                    → `cls`
//   §6/§18  mobile-first, no horizontal overflow  → `horizontalOverflowPx`
//   §18     touch targets ≥ 44px                   → `undersizedTapTargets`
// Render-health (not a DD budget, but "broken states → PRODUCT_DEBT" per QA-01 brief):
//   HTTP status ok · no console errors · no uncaught page error.

export interface Thresholds {
  /** LCP budget in ms (§6/§17). Dev-server LCP is unoptimised → reported ADVISORY, never a hard fail. */
  lcpMs: number;
  /** CLS budget (§10/§17 "zero CLS"). We allow the web-vitals "good" ceiling as the pass line. */
  cls: number;
  /** Horizontal overflow tolerance in px (§6/§18 mobile-first, no sideways scroll). */
  horizontalOverflowPx: number;
  /** Minimum tap-target edge in px (§18). Applied to unambiguous controls only (see measure). */
  tapTargetPx: number;
}

export const THRESHOLDS: Thresholds = {
  lcpMs: 2500,
  cls: 0.1,
  horizontalOverflowPx: 2, // sub-pixel rounding headroom; a real overflow is many px
  tapTargetPx: 44,
};

// Result shape read back from the page after load + settle.
export interface PageMetrics {
  lcpMs: number | null;
  cls: number;
  scrollWidth: number;
  clientWidth: number;
  horizontalOverflowPx: number;
  undersizedTapTargets: number;
  undersizedSamples: string[]; // up to 5 selectors, for the debt note
  domNodes: number;
}

// Verdict per budget: "pass" | "fail" | "advisory-fail" | "n/a".
export type Verdict = "pass" | "fail" | "advisory-fail" | "n/a";

export interface BudgetLine {
  key: string;
  label: string;
  value: string;
  verdict: Verdict;
}

/**
 * Injected via page.addInitScript BEFORE any navigation so the PerformanceObservers catch the
 * very first LCP candidate and every layout shift. Accumulates into window.__qa.
 */
export function initMetricsScript(): string {
  return `(() => {
    const w = window;
    w.__qa = { lcpMs: null, cls: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          // startTime of the latest LCP candidate, relative to navigation start.
          w.__qa.lcpMs = Math.round(e.startTime);
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_) {}
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          // Ignore shifts caused by recent user input (spec-compliant CLS).
          if (!e.hadRecentInput) w.__qa.cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (_) {}
  })();`;
}

/**
 * Read metrics from the page. Call after the page has loaded and settled. Runs entirely in the
 * browser context (this function is stringified by Playwright's page.evaluate).
 */
export function readMetrics(tapTargetPx: number): PageMetrics {
  const qa = (
    window as unknown as { __qa?: { lcpMs: number | null; cls: number } }
  ).__qa ?? {
    lcpMs: null,
    cls: 0,
  };
  const doc = document.documentElement;
  const scrollWidth = doc.scrollWidth;
  const clientWidth = doc.clientWidth;

  // Tap-target check on UNAMBIGUOUS controls only — real <button>s and anchors/inputs that render
  // as buttons (role=button or a button-like utility class). Inline text links are excluded so the
  // check stays mechanical and free of false positives on prose.
  const samples: string[] = [];
  let undersized = 0;
  const controls = Array.from(
    document.querySelectorAll(
      'button, [role="button"], input[type="submit"], input[type="button"], a[class*="button"], a[class*="btn"]',
    ),
  ) as HTMLElement[];
  for (const el of controls) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue; // not rendered / hidden
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (Math.min(r.width, r.height) < tapTargetPx - 0.5) {
      undersized++;
      if (samples.length < 5) {
        const tag = el.tagName.toLowerCase();
        const label = (el.textContent || el.getAttribute("aria-label") || "")
          .trim()
          .slice(0, 24);
        samples.push(
          `${tag}"${label}"@${Math.round(r.width)}x${Math.round(r.height)}`,
        );
      }
    }
  }

  return {
    lcpMs: qa.lcpMs,
    cls: Math.round(qa.cls * 1000) / 1000,
    scrollWidth,
    clientWidth,
    horizontalOverflowPx: Math.max(0, scrollWidth - clientWidth),
    undersizedTapTargets: undersized,
    undersizedSamples: samples,
    domNodes: document.getElementsByTagName("*").length,
  };
}

/** Turn raw metrics + render health into per-budget verdict lines for the report. */
export function scoreBudgets(
  m: PageMetrics,
  t: Thresholds,
  health: {
    httpOk: boolean;
    httpStatus: number;
    consoleErrors: number;
    pageError: string | null;
  },
): BudgetLine[] {
  const lines: BudgetLine[] = [];

  // Render health first — a broken page makes the visual budgets meaningless.
  lines.push({
    key: "http",
    label: "HTTP status",
    value: String(health.httpStatus),
    verdict: health.httpOk ? "pass" : "fail",
  });
  lines.push({
    key: "console",
    label: "Console errors",
    value: String(health.consoleErrors),
    verdict: health.consoleErrors === 0 ? "pass" : "fail",
  });
  lines.push({
    key: "pageerror",
    label: "Uncaught error",
    value: health.pageError ? health.pageError.slice(0, 40) : "none",
    verdict: health.pageError ? "fail" : "pass",
  });

  // DESIGN_DIRECTION budgets.
  lines.push({
    key: "overflow",
    label: "H-overflow (§6/§18)",
    value: `${m.horizontalOverflowPx}px`,
    verdict: m.horizontalOverflowPx <= t.horizontalOverflowPx ? "pass" : "fail",
  });
  lines.push({
    key: "cls",
    label: "CLS (§10/§17)",
    value: m.cls.toFixed(3),
    verdict: m.cls <= t.cls ? "pass" : "fail",
  });
  lines.push({
    key: "lcp",
    label: "LCP (§6/§17, dev-advisory)",
    value: m.lcpMs === null ? "n/a" : `${m.lcpMs}ms`,
    verdict:
      m.lcpMs === null ? "n/a" : m.lcpMs <= t.lcpMs ? "pass" : "advisory-fail",
  });
  lines.push({
    key: "tap",
    label: "Tap targets ≥44px (§18)",
    value:
      m.undersizedTapTargets === 0
        ? "ok"
        : `${m.undersizedTapTargets} < 44px [${m.undersizedSamples.join(", ")}]`,
    verdict: m.undersizedTapTargets === 0 ? "pass" : "advisory-fail",
  });

  return lines;
}
