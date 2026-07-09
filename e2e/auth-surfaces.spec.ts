import { test, expect } from "@playwright/test";

// Read-only coverage of the Phase A (DR-036) auth surfaces. No form submissions → no DB writes to
// the shared Supabase (integration writes are un-cleanable there). Proves the invite-only register
// gate, the no-code "contact us" state, and the login password + OTP/reset affordances all render.

test.describe("auth surfaces (Phase A, read-only)", () => {
  test("register opens on the referral-code gate with a no-code contact path", async ({
    page,
  }) => {
    await page.goto("/register");
    await expect(page.getByText(/invite-only/i)).toBeVisible();
    await expect(page.getByLabel(/Referral code/i)).toBeVisible();
    // No-code "Contact company" state (§4.4).
    await expect(page.getByText(/Don't have a code\?/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /WhatsApp/i })).toBeVisible();
  });

  test("an invalid ?ref keeps the visitor on the code gate (no enumeration leak)", async ({
    page,
  }) => {
    await page.goto("/register?ref=GSDOESNOTEXIST");
    await expect(page.getByLabel(/Referral code/i)).toBeVisible();
    // It must NOT jump to the details step (that only happens for a resolved sponsor).
    await expect(page.getByLabel(/Create a password/i)).toHaveCount(0);
  });

  test("login shows password sign-in plus OTP and reset alternatives", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/Mobile number/i)).toBeVisible();
    await expect(page.getByLabel(/^Password$/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Sign in with OTP/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Forgot password\?/i }),
    ).toBeVisible();

    // The reset affordance switches into the OTP-reset mode.
    await page.getByRole("button", { name: /Forgot password\?/i }).click();
    await expect(
      page.getByRole("heading", { name: /Reset your password/i }),
    ).toBeVisible();
  });
});
