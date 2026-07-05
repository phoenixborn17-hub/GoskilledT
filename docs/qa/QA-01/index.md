# QA-01 — Screenshot & Budget Harness

> Mechanical capture of **every route** at **360 / 768 / 1280px** in each reachable state (default · empty · loading · error), scored against the objective **DESIGN_DIRECTION v1.0** budgets. **No UX opinions** — this harness measures numbers only; subjective quality is out of scope.

- **Generated:** 2026-07-04T21:39:47.139Z
- **Target:** http://localhost:3000 (Next dev server — see LCP caveat below)
- **Sessions:** public (none) · learner (`qa-learner@goskilledqa.com`) · admin (`qa-admin@goskilledqa.com`, role minted via SQL) — see `scripts/qa-auth-bootstrap.ts`.
- **Fixtures:** courseSlug=`ai-prompt-mastery` · adminCourseId=`cmr47q41e0000wkg45nlfids7` · kycUserId=`cmr6svr7x001bwk4415ggsje8` · verifySerial=`GS-HHC4Q-CZANA`

## Result summary

| ✅ PASS | 🟡 ADVISORY | ❌ FAIL | ⏭️ SKIP | 💥 ERROR | Total |
|---|---|---|---|---|---|
| 91 | 78 | 8 | 0 | 0 | 177 |

**FAIL** = a hard budget miss (broken render, horizontal overflow, or CLS) → filed to PRODUCT_DEBT.
**ADVISORY** = only dev-LCP or tap-target below budget (see caveats) — reported, not filed.

## Budgets & thresholds

| Budget | Threshold | Kind | Pass rate (captured) |
|---|---|---|---|
| HTTP status ok | status < 400 (error states < 500) | hard | 177/177 |
| No console errors | 0 errors | hard | 172/177 |
| No uncaught error | none | hard | 177/177 |
| No H-overflow (§6/§18) | ≤ 2px | hard | 176/177 |
| CLS ≤ 0.1 (§10/§17) | ≤ 0.1 | hard | 175/177 |
| LCP < 2.5s (§6/§17, advisory) | < 2500ms | advisory | 94/147 |
| Tap ≥44px (§18, advisory) | ≥ 44px | advisory | 121/177 |

> **LCP caveat:** measured on the **Next dev server** (unminified, on-demand compiled, source maps) — these numbers run far above production and are **advisory only**, never a hard fail. A production-build LCP pass is a separate ticket. **Tap-target caveat:** applied to unambiguous controls (`<button>`, `[role=button]`, button-classed anchors); inline text links are excluded, so a small count is expected. **CLS caveat:** dev-server font swaps + on-demand compile can *over-report* layout shift and it varies slightly run-to-run, so a borderline CLS (~0.1–0.2) is indicative — confirm against a production build before treating it as fixed. Horizontal-overflow is deterministic and not subject to this caveat.

## Route matrix

Each cell links to the full-page screenshot. Columns are the three widths; rows group by route → state.

**State coverage:** `default` is the normal render. A `default (=empty)` label means the fresh QA learner account has no data there, so the default shot **is** the genuine empty state (nothing fabricated — DR-029). `loading` shots capture the real `loading.tsx` skeleton under network throttle. `error` shots hit a deliberately invalid param (not-found / invalid state).

| Route | Auth | Register | State | 360px | 768px | 1280px | Measurements (1280) |
|---|---|---|---|---|---|---|---|
| `home`<br><sub>/</sub> | none | Consumer | default | [✅ PASS](shots/home__default__360.png) | [✅ PASS](shots/home__default__768.png) | [✅ PASS](shots/home__default__1280.png) | ovf 0px · CLS 0.005 · LCP 756ms · tap 0 |
| `about`<br><sub>/about</sub> | none | Consumer | default | [🟡 ADV](shots/about__default__360.png) | [✅ PASS](shots/about__default__768.png) | [✅ PASS](shots/about__default__1280.png) | ovf 0px · CLS 0.007 · LCP 1100ms · tap 0 |
| `contact`<br><sub>/contact</sub> | none | Consumer | default | [🟡 ADV](shots/contact__default__360.png) | [✅ PASS](shots/contact__default__768.png) | [✅ PASS](shots/contact__default__1280.png) | ovf 0px · CLS 0.001 · LCP 364ms · tap 0 |
| `courses`<br><sub>/courses</sub> | none | Consumer | default | [🟡 ADV](shots/courses__default__360.png) | [✅ PASS](shots/courses__default__768.png) | [✅ PASS](shots/courses__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1576ms · tap 0 |
| `courses`<br><sub>/courses</sub> | none | Consumer | loading | [✅ PASS](shots/courses__loading__360.png) | [✅ PASS](shots/courses__loading__768.png) | [✅ PASS](shots/courses__loading__1280.png) | ovf 0px · CLS 0.000 · LCP n/a · tap 0 |
| `course-detail`<br><sub>/courses/ai-prompt-mastery</sub> | none | Consumer | default | [🟡 ADV](shots/course-detail__default__360.png) | [✅ PASS](shots/course-detail__default__768.png) | [✅ PASS](shots/course-detail__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1236ms · tap 0 |
| `course-detail`<br><sub>/courses/ai-prompt-mastery</sub> | none | Consumer | loading | [✅ PASS](shots/course-detail__loading__360.png) | [✅ PASS](shots/course-detail__loading__768.png) | [✅ PASS](shots/course-detail__loading__1280.png) | ovf 0px · CLS 0.000 · LCP n/a · tap 0 |
| `course-detail`<br><sub>/courses/no-such-course</sub> | none | Consumer | error | [✅ PASS](shots/course-detail__error__360.png) | [✅ PASS](shots/course-detail__error__768.png) | [✅ PASS](shots/course-detail__error__1280.png) | ovf 0px · CLS 0.000 · LCP 1260ms · tap 0 |
| `packages`<br><sub>/packages</sub> | none | Consumer | default | [❌ FAIL](shots/packages__default__360.png) | [✅ PASS](shots/packages__default__768.png) | [✅ PASS](shots/packages__default__1280.png) | ovf 0px · CLS 0.000 · LCP 628ms · tap 0 |
| `packages`<br><sub>/packages</sub> | none | Consumer | loading | [✅ PASS](shots/packages__loading__360.png) | [✅ PASS](shots/packages__loading__768.png) | [✅ PASS](shots/packages__loading__1280.png) | ovf 0px · CLS 0.000 · LCP n/a · tap 0 |
| `webinar`<br><sub>/webinar</sub> | none | Consumer | default | [🟡 ADV](shots/webinar__default__360.png) | [✅ PASS](shots/webinar__default__768.png) | [✅ PASS](shots/webinar__default__1280.png) | ovf 0px · CLS 0.012 · LCP 496ms · tap 0 |
| `earn-public`<br><sub>/earn</sub> | none | Consumer | default | [🟡 ADV](shots/earn-public__default__360.png) | [✅ PASS](shots/earn-public__default__768.png) | [✅ PASS](shots/earn-public__default__1280.png) | ovf 0px · CLS 0.000 · LCP 640ms · tap 0 |
| `blog`<br><sub>/blog</sub> | none | Consumer | default | [🟡 ADV](shots/blog__default__360.png) | [✅ PASS](shots/blog__default__768.png) | [✅ PASS](shots/blog__default__1280.png) | ovf 0px · CLS 0.001 · LCP 624ms · tap 0 |
| `videos`<br><sub>/videos</sub> | none | Consumer | default | [🟡 ADV](shots/videos__default__360.png) | [✅ PASS](shots/videos__default__768.png) | [✅ PASS](shots/videos__default__1280.png) | ovf 0px · CLS 0.001 · LCP 1856ms · tap 0 |
| `faq`<br><sub>/faq</sub> | none | Consumer | default | [❌ FAIL](shots/faq__default__360.png) | [✅ PASS](shots/faq__default__768.png) | [✅ PASS](shots/faq__default__1280.png) | ovf 0px · CLS 0.001 · LCP 700ms · tap 0 |
| `login`<br><sub>/login</sub> | none | Consumer | default | [❌ FAIL](shots/login__default__360.png) | [✅ PASS](shots/login__default__768.png) | [✅ PASS](shots/login__default__1280.png) | ovf 0px · CLS 0.000 · LCP 480ms · tap 0 |
| `register`<br><sub>/register</sub> | none | Consumer | default | [🟡 ADV](shots/register__default__360.png) | [✅ PASS](shots/register__default__768.png) | [✅ PASS](shots/register__default__1280.png) | ovf 0px · CLS 0.000 · LCP 372ms · tap 0 |
| `checkout`<br><sub>/checkout?package=career-booster</sub> | none | Trust | default | [🟡 ADV](shots/checkout__default__360.png) | [✅ PASS](shots/checkout__default__768.png) | [✅ PASS](shots/checkout__default__1280.png) | ovf 0px · CLS 0.000 · LCP 636ms · tap 0 |
| `disclaimer`<br><sub>/disclaimer</sub> | none | Trust | default | [✅ PASS](shots/disclaimer__default__360.png) | [✅ PASS](shots/disclaimer__default__768.png) | [✅ PASS](shots/disclaimer__default__1280.png) | ovf 0px · CLS 0.001 · LCP 884ms · tap 0 |
| `privacy`<br><sub>/privacy</sub> | none | Trust | default | [✅ PASS](shots/privacy__default__360.png) | [✅ PASS](shots/privacy__default__768.png) | [✅ PASS](shots/privacy__default__1280.png) | ovf 0px · CLS 0.009 · LCP 564ms · tap 0 |
| `terms`<br><sub>/terms</sub> | none | Trust | default | [🟡 ADV](shots/terms__default__360.png) | [✅ PASS](shots/terms__default__768.png) | [✅ PASS](shots/terms__default__1280.png) | ovf 0px · CLS 0.001 · LCP 628ms · tap 0 |
| `refund-policy`<br><sub>/refund-policy</sub> | none | Trust | default | [✅ PASS](shots/refund-policy__default__360.png) | [✅ PASS](shots/refund-policy__default__768.png) | [✅ PASS](shots/refund-policy__default__1280.png) | ovf 0px · CLS 0.001 · LCP 444ms · tap 0 |
| `verify`<br><sub>/verify/GS-HHC4Q-CZANA</sub> | none | Trust | default | [🟡 ADV](shots/verify__default__360.png) | [✅ PASS](shots/verify__default__768.png) | [✅ PASS](shots/verify__default__1280.png) | ovf 0px · CLS 0.001 · LCP 1000ms · tap 0 |
| `verify`<br><sub>/verify/GS-NOT-A-REAL-SERIAL</sub> | none | Trust | error | [✅ PASS](shots/verify__error__360.png) | [✅ PASS](shots/verify__error__768.png) | [✅ PASS](shots/verify__error__1280.png) | ovf 0px · CLS 0.001 · LCP 712ms · tap 0 |
| `welcome`<br><sub>/welcome</sub> | user | Consumer | default | [🟡 ADV](shots/welcome__default__360.png) | [✅ PASS](shots/welcome__default__768.png) | [✅ PASS](shots/welcome__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1352ms · tap 0 |
| `onboarding`<br><sub>/onboarding</sub> | user | Consumer | default | [✅ PASS](shots/onboarding__default__360.png) | [🟡 ADV](shots/onboarding__default__768.png) | [🟡 ADV](shots/onboarding__default__1280.png) | ovf 0px · CLS 0.000 · LCP 752ms · tap 3 |
| `dashboard`<br><sub>/dashboard</sub> | user | Consumer | default (=empty) | [🟡 ADV](shots/dashboard__default__360.png) | [🟡 ADV](shots/dashboard__default__768.png) | [🟡 ADV](shots/dashboard__default__1280.png) | ovf 0px · CLS 0.000 · LCP 5916ms · tap 2 |
| `dashboard`<br><sub>/dashboard</sub> | user | Consumer | loading | [✅ PASS](shots/dashboard__loading__360.png) | [✅ PASS](shots/dashboard__loading__768.png) | [✅ PASS](shots/dashboard__loading__1280.png) | ovf 0px · CLS 0.000 · LCP n/a · tap 0 |
| `dashboard-courses`<br><sub>/dashboard/courses</sub> | user | Consumer | default (=empty) | [🟡 ADV](shots/dashboard-courses__default__360.png) | [🟡 ADV](shots/dashboard-courses__default__768.png) | [✅ PASS](shots/dashboard-courses__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1780ms · tap 0 |
| `dashboard-courses`<br><sub>/dashboard/courses</sub> | user | Consumer | loading | [✅ PASS](shots/dashboard-courses__loading__360.png) | [✅ PASS](shots/dashboard-courses__loading__768.png) | [✅ PASS](shots/dashboard-courses__loading__1280.png) | ovf 0px · CLS 0.000 · LCP n/a · tap 0 |
| `dashboard-learn`<br><sub>/dashboard/learn</sub> | user | Consumer | default (=empty) | [🟡 ADV](shots/dashboard-learn__default__360.png) | [✅ PASS](shots/dashboard-learn__default__768.png) | [✅ PASS](shots/dashboard-learn__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1532ms · tap 0 |
| `course-player`<br><sub>/dashboard/learn/ai-prompt-mastery</sub> | user | Consumer | default | [❌ FAIL](shots/course-player__default__360.png) | [🟡 ADV](shots/course-player__default__768.png) | [🟡 ADV](shots/course-player__default__1280.png) | ovf 0px · CLS 0.000 · LCP 2816ms · tap 0 |
| `course-player`<br><sub>/dashboard/learn/ai-prompt-mastery</sub> | user | Consumer | loading | [✅ PASS](shots/course-player__loading__360.png) | [✅ PASS](shots/course-player__loading__768.png) | [✅ PASS](shots/course-player__loading__1280.png) | ovf 0px · CLS 0.000 · LCP n/a · tap 0 |
| `dashboard-progress`<br><sub>/dashboard/progress</sub> | user | Consumer | default (=empty) | [🟡 ADV](shots/dashboard-progress__default__360.png) | [🟡 ADV](shots/dashboard-progress__default__768.png) | [✅ PASS](shots/dashboard-progress__default__1280.png) | ovf 0px · CLS 0.000 · LCP 2020ms · tap 0 |
| `dashboard-progress`<br><sub>/dashboard/progress</sub> | user | Consumer | loading | [✅ PASS](shots/dashboard-progress__loading__360.png) | [✅ PASS](shots/dashboard-progress__loading__768.png) | [✅ PASS](shots/dashboard-progress__loading__1280.png) | ovf 0px · CLS 0.000 · LCP n/a · tap 0 |
| `profile`<br><sub>/dashboard/profile</sub> | user | Trust | default | [🟡 ADV](shots/profile__default__360.png) | [🟡 ADV](shots/profile__default__768.png) | [🟡 ADV](shots/profile__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1796ms · tap 3 |
| `profile`<br><sub>/dashboard/profile</sub> | user | Trust | loading | [✅ PASS](shots/profile__loading__360.png) | [✅ PASS](shots/profile__loading__768.png) | [✅ PASS](shots/profile__loading__1280.png) | ovf 0px · CLS 0.000 · LCP n/a · tap 0 |
| `earn-hub`<br><sub>/dashboard/earn</sub> | user | Consumer | default (=empty) | [❌ FAIL](shots/earn-hub__default__360.png) | [❌ FAIL](shots/earn-hub__default__768.png) | [🟡 ADV](shots/earn-hub__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1928ms · tap 1 |
| `earn-hub`<br><sub>/dashboard/earn</sub> | user | Consumer | loading | [✅ PASS](shots/earn-hub__loading__360.png) | [✅ PASS](shots/earn-hub__loading__768.png) | [✅ PASS](shots/earn-hub__loading__1280.png) | ovf 0px · CLS 0.000 · LCP n/a · tap 0 |
| `earn-commissions`<br><sub>/dashboard/earn/commissions</sub> | user | Trust | default (=empty) | [🟡 ADV](shots/earn-commissions__default__360.png) | [✅ PASS](shots/earn-commissions__default__768.png) | [✅ PASS](shots/earn-commissions__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1708ms · tap 0 |
| `earn-referrals`<br><sub>/dashboard/earn/referrals</sub> | user | Consumer | default (=empty) | [❌ FAIL](shots/earn-referrals__default__360.png) | [🟡 ADV](shots/earn-referrals__default__768.png) | [🟡 ADV](shots/earn-referrals__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1796ms · tap 1 |
| `earn-wallet`<br><sub>/dashboard/earn/wallet</sub> | user | Trust | default (=empty) | [🟡 ADV](shots/earn-wallet__default__360.png) | [✅ PASS](shots/earn-wallet__default__768.png) | [✅ PASS](shots/earn-wallet__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1560ms · tap 0 |
| `earn-kyc`<br><sub>/dashboard/earn/kyc</sub> | user | Trust | default (=empty) | [🟡 ADV](shots/earn-kyc__default__360.png) | [✅ PASS](shots/earn-kyc__default__768.png) | [✅ PASS](shots/earn-kyc__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1332ms · tap 0 |
| `admin-home`<br><sub>/admin</sub> | admin | Admin | default | [🟡 ADV](shots/admin-home__default__360.png) | [🟡 ADV](shots/admin-home__default__768.png) | [🟡 ADV](shots/admin-home__default__1280.png) | ovf 0px · CLS 0.000 · LCP 2036ms · tap 1 |
| `admin-home`<br><sub>/admin</sub> | admin | Admin | loading | [🟡 ADV](shots/admin-home__loading__360.png) | [🟡 ADV](shots/admin-home__loading__768.png) | [🟡 ADV](shots/admin-home__loading__1280.png) | ovf 0px · CLS 0.000 · LCP n/a · tap 1 |
| `admin-leads`<br><sub>/admin/leads</sub> | admin | Admin | default (=empty) | [🟡 ADV](shots/admin-leads__default__360.png) | [🟡 ADV](shots/admin-leads__default__768.png) | [🟡 ADV](shots/admin-leads__default__1280.png) | ovf 0px · CLS 0.000 · LCP 2156ms · tap 1 |
| `admin-payments`<br><sub>/admin/payments</sub> | admin | Admin | default (=empty) | [🟡 ADV](shots/admin-payments__default__360.png) | [🟡 ADV](shots/admin-payments__default__768.png) | [🟡 ADV](shots/admin-payments__default__1280.png) | ovf 0px · CLS 0.000 · LCP 2936ms · tap 1 |
| `admin-review-queue`<br><sub>/admin/review-queue</sub> | admin | Admin | default (=empty) | [🟡 ADV](shots/admin-review-queue__default__360.png) | [🟡 ADV](shots/admin-review-queue__default__768.png) | [🟡 ADV](shots/admin-review-queue__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1500ms · tap 1 |
| `admin-users`<br><sub>/admin/users</sub> | admin | Admin | default | [❌ FAIL](shots/admin-users__default__360.png) | [🟡 ADV](shots/admin-users__default__768.png) | [🟡 ADV](shots/admin-users__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1916ms · tap 2 |
| `admin-audit`<br><sub>/admin/audit</sub> | admin | Admin | default | [🟡 ADV](shots/admin-audit__default__360.png) | [🟡 ADV](shots/admin-audit__default__768.png) | [🟡 ADV](shots/admin-audit__default__1280.png) | ovf 0px · CLS 0.000 · LCP 2276ms · tap 2 |
| `admin-catalog`<br><sub>/admin/catalog</sub> | admin | Admin | default | [🟡 ADV](shots/admin-catalog__default__360.png) | [🟡 ADV](shots/admin-catalog__default__768.png) | [🟡 ADV](shots/admin-catalog__default__1280.png) | ovf 0px · CLS 0.007 · LCP 2368ms · tap 1 |
| `admin-catalog-detail`<br><sub>/admin/catalog/cmr47q41e0000wkg45nlfids7</sub> | admin | Admin | default | [🟡 ADV](shots/admin-catalog-detail__default__360.png) | [🟡 ADV](shots/admin-catalog-detail__default__768.png) | [🟡 ADV](shots/admin-catalog-detail__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1384ms · tap 11 |
| `admin-catalog-detail`<br><sub>/admin/catalog/no-such-course-id</sub> | admin | Admin | error | [✅ PASS](shots/admin-catalog-detail__error__360.png) | [✅ PASS](shots/admin-catalog-detail__error__768.png) | [🟡 ADV](shots/admin-catalog-detail__error__1280.png) | ovf 0px · CLS 0.000 · LCP 2504ms · tap 0 |
| `admin-kyc`<br><sub>/admin/kyc</sub> | admin | Admin | default (=empty) | [🟡 ADV](shots/admin-kyc__default__360.png) | [🟡 ADV](shots/admin-kyc__default__768.png) | [🟡 ADV](shots/admin-kyc__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1548ms · tap 1 |
| `admin-kyc-detail`<br><sub>/admin/kyc/cmr6svr7x001bwk4415ggsje8</sub> | admin | Admin | default | [🟡 ADV](shots/admin-kyc-detail__default__360.png) | [🟡 ADV](shots/admin-kyc-detail__default__768.png) | [🟡 ADV](shots/admin-kyc-detail__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1724ms · tap 1 |
| `admin-kyc-detail`<br><sub>/admin/kyc/no-such-user-id</sub> | admin | Admin | error | [✅ PASS](shots/admin-kyc-detail__error__360.png) | [🟡 ADV](shots/admin-kyc-detail__error__768.png) | [🟡 ADV](shots/admin-kyc-detail__error__1280.png) | ovf 0px · CLS 0.000 · LCP 2924ms · tap 0 |
| `admin-settings`<br><sub>/admin/settings</sub> | admin | Admin | default | [🟡 ADV](shots/admin-settings__default__360.png) | [🟡 ADV](shots/admin-settings__default__768.png) | [🟡 ADV](shots/admin-settings__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1596ms · tap 1 |
| `admin-webinar`<br><sub>/admin/webinar</sub> | admin | Admin | default | [🟡 ADV](shots/admin-webinar__default__360.png) | [🟡 ADV](shots/admin-webinar__default__768.png) | [🟡 ADV](shots/admin-webinar__default__1280.png) | ovf 0px · CLS 0.000 · LCP 1564ms · tap 2 |
| `admin-withdrawals`<br><sub>/admin/withdrawals</sub> | admin | Admin | default (=empty) | [🟡 ADV](shots/admin-withdrawals__default__360.png) | [🟡 ADV](shots/admin-withdrawals__default__768.png) | [🟡 ADV](shots/admin-withdrawals__default__1280.png) | ovf 0px · CLS 0.000 · LCP 2404ms · tap 35 |

## Broken states (→ PRODUCT_DEBT.md)

> Console-error findings are **per-shot observations** — a React hydration warning can be intermittent, so the exact width column reflects which shot caught it, not a width-specific bug. The route + error sample is the signal. Overflow is deterministic; CLS carries the dev caveat above.

| Route | State | Width | What broke |
|---|---|---|---|
| `packages` | default | 360px | CLS (§10/§17)=0.144 |
| `faq` | default | 360px | CLS (§10/§17)=0.210 |
| `login` | default | 360px | Console errors=1 |
| `course-player` | default | 360px | H-overflow (§6/§18)=6px |
| `earn-hub` | default | 360px | Console errors=1 |
| `earn-hub` | default | 768px | Console errors=1 |
| `earn-referrals` | default | 360px | Console errors=1 |
| `admin-users` | default | 360px | Console errors=1 |

---

_Regenerate: `npx tsx scripts/qa-auth-bootstrap.ts && npx playwright test --config playwright.qa.config.ts && npx tsx scripts/qa-report.ts`._
