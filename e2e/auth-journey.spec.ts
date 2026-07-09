import { test, expect } from "@playwright/test";

// Phase A §4.5 — the full "Get-Started → register(valid code) → OTP → welcome → Lesson 0 → dashboard"
// journey, plus login → dashboard. This WRITES to Supabase + the DB and needs the staging OTP bypass
// active (any phone + STAGING_OTP_CODE, no SMS), so it is DISABLED by default and only runs against a
// staging deployment. Enable by setting:
//   E2E_JOURNEY_REF   — a REAL, existing sponsor referral code on the target env (mandatory gate)
//   STAGING_OTP_CODE  — the fixed bypass code (defaults to 123456)
// Run: E2E_JOURNEY_REF=GS... npx playwright test e2e/auth-journey.spec.ts
const REF = process.env.E2E_JOURNEY_REF;
const OTP = process.env.STAGING_OTP_CODE || "123456";
// A fresh 10-digit-ish phone per run so we always exercise the NEW-account path (→ /welcome).
const PHONE = `9${String(Date.now()).slice(-9)}`;
const PASSWORD = "PhaseAe2e!pass";

test.describe("auth journey (staging only — writes)", () => {
  test.skip(
    !REF,
    "Set E2E_JOURNEY_REF to a real sponsor code to run the write journey.",
  );

  test("register with a valid code → OTP → welcome → dashboard, then password login → dashboard", async ({
    page,
  }) => {
    // 1) Land via an affiliate link (carries ?ref) — the form opens on the details step.
    await page.goto(`/register?ref=${REF}`);
    await expect(page.getByLabel(/Mobile number/i)).toBeVisible();

    // 2) Provide mobile + password → send OTP.
    await page.getByLabel(/Mobile number/i).fill(PHONE);
    await page.getByLabel(/Create a password/i).fill(PASSWORD);
    await page.getByRole("button", { name: /Send OTP/i }).click();

    // 3) Enter the staging bypass code (segmented OtpInput → type digits).
    await expect(page.getByText(/Sent to \+91/i)).toBeVisible();
    for (const d of OTP) await page.keyboard.type(d);

    // 4) New account → the one-time welcome moment.
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByText(/Founding Batch/i)).toBeVisible();

    // 5) Start Lesson 0 → the LMS player (or the Hub if Lesson 0 is unseeded).
    await page
      .getByRole("button", { name: /(start|intro|begin)/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 6) Log out is out of scope; assert the password login path independently.
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel(/Mobile number/i).fill(PHONE);
    await page.getByLabel(/^Password$/i).fill(PASSWORD);
    await page.getByRole("button", { name: /^Log in$/i }).click();
    await expect(page).toHaveURL(/\/dashboard/); // returning user → straight to the Hub
  });
});
