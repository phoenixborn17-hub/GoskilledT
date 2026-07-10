import { test, expect } from "@playwright/test";

// Read-only smoke coverage for the public website. No form submissions → no DB writes.
// Verifies rendering, navigation, the CSS-only mobile menu, FAQ accordions, the branded 404,
// and baseline security headers — interaction coverage that curl/Lighthouse can't provide.

test.describe("public website smoke", () => {
  test("homepage renders hero, sections and footer", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /Seekho/ }),
    ).toBeVisible();
    // Section stack landmarks
    await expect(
      page.getByRole("heading", { name: "Why GoSkilled" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /You're early/ }),
    ).toBeVisible();
    // Footer identity line
    await expect(page.getByText(/Made in India/)).toBeVisible();
  });

  test("header nav navigates to Courses", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Courses" })
      .click();
    await expect(page).toHaveURL(/\/courses$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Courses" }),
    ).toBeVisible();
  });

  test("mobile menu opens and exposes nav links", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    // Desktop nav is hidden at this width; open the CSS-only <details> menu. Scope link lookups to
    // the disclosure so the footer's own "Packages" link doesn't collide.
    // Native <summary> is exposed as role "generic" (not "button") in Chromium, so click the
    // element directly rather than by role.
    const disclosure = page.locator(
      "details:has(summary[aria-label='Open menu'])",
    );
    await disclosure.locator("summary").click();
    await expect(
      disclosure.getByRole("link", { name: "Packages" }),
    ).toBeVisible();
    await expect(disclosure.getByRole("link", { name: "FAQ" })).toBeVisible();
  });

  test("FAQ accordion expands an answer", async ({ page }) => {
    await page.goto("/faq");
    await expect(
      page.getByRole("heading", { level: 1, name: /Frequently asked/ }),
    ).toBeVisible();
    // <summary> is role "generic" in Chromium — click the element by its text, not by role.
    await page
      .locator("summary", { hasText: "Do I pay GST on top of the price?" })
      .click();
    await expect(page.getByText(/GST is already included/)).toBeVisible();
  });

  test("unknown route renders the branded 404", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/took a wrong turn/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Back to home/ }),
    ).toBeVisible();
  });

  test("baseline security headers are present", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("SAMEORIGIN");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    // Unit 3 (launch hardening): these were configured but untested — lock them in.
    expect(h["permissions-policy"]).toContain("geolocation=()");
    expect(h["strict-transport-security"]).toContain("max-age=");
  });
});
