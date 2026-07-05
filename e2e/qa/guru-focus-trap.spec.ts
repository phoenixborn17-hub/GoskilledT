// DR-031 Batch 1 · PRODUCT_DEBT #9 — in-browser proof that the Guru panel is a proper focus trap.
// Real Chromium (jsdom can't do offsetParent/layout, which the trap's visibility filter relies on).
// Uses the QA learner session; the lesson route renders the panel for any authed user, and ?guru=1
// opens it. Asserts: Tab wraps last→first, Shift+Tab wraps first→last, focus never lands on the
// dimmed backdrop, Esc closes, and focus returns to the launcher. Run via playwright.a11y.config.ts.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { USER_STATE, FIXTURES, type Fixtures } from "./env";

const fixtures = JSON.parse(readFileSync(FIXTURES, "utf8")) as Fixtures;

test.use({ storageState: USER_STATE });

test("Guru panel traps keyboard focus (WCAG 2.4.3)", async ({ page }) => {
  test.skip(
    !fixtures.courseSlug,
    "no course fixture — run qa-auth-bootstrap first",
  );

  await page.goto(`/dashboard/learn/${fixtures.courseSlug}?guru=1`);

  const dialog = page.getByRole("dialog", { name: /guru/i });
  await expect(dialog).toBeVisible();

  // Focusable elements inside the SHEET only (the backdrop is a sibling of the sheet inside the
  // dialog — tabIndex=-1 + aria-hidden — and must be excluded, exactly as the component's trap does).
  const sheet = dialog.locator(".guru-sheet");
  const focusables = sheet.locator(
    'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
  );
  const count = await focusables.count();
  expect(count).toBeGreaterThan(0);

  const isInSheet = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      const s = document.querySelector(".guru-sheet");
      return !!(el && s && s.contains(el));
    });
  const activeLabel = () =>
    page.evaluate(
      () =>
        document.activeElement?.getAttribute("aria-label") ??
        document.activeElement?.tagName ??
        null,
    );

  // Move focus to the LAST focusable, then Tab → must wrap to the FIRST (stay inside the sheet).
  await focusables.last().focus();
  await page.keyboard.press("Tab");
  expect(await isInSheet(), "Tab from last stays in sheet").toBe(true);
  await expect(focusables.first()).toBeFocused();

  // From the FIRST, Shift+Tab → must wrap to the LAST.
  await focusables.first().focus();
  await page.keyboard.press("Shift+Tab");
  expect(await isInSheet(), "Shift+Tab from first stays in sheet").toBe(true);
  await expect(focusables.last()).toBeFocused();

  // The dimmed backdrop must never receive focus (it is aria-hidden + tabIndex=-1).
  await page.evaluate(() => {
    (
      document.querySelector('[aria-hidden="true"].absolute') as HTMLElement
    )?.focus?.();
  });
  // Cycle a few Tabs; focus must remain inside the sheet throughout.
  for (let i = 0; i < count + 2; i++) {
    await page.keyboard.press("Tab");
    expect(await isInSheet(), `Tab #${i} stays in sheet`).toBe(true);
  }
  void activeLabel;

  // Esc closes the panel and returns focus to the launcher ("Ask Guru").
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: /ask guru/i })).toBeFocused();
});
