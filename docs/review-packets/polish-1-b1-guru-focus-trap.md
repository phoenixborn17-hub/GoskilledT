# Review Packet — polish-1 B1: Guru panel focus trap (PRODUCT_DEBT #9, a11y)

**Branch:** `gps-polish-1` · **Commit:** `d26c1ae` · **Tier:** B (a11y) · **Diff:** [`polish-1-b1-guru-focus-trap.diff`](polish-1-b1-guru-focus-trap.diff)

## What & why

PRODUCT_DEBT #9: the Guru companion modal had `aria-modal` + focus-on-open + Esc, but no Tab-wrap trap — keyboard focus could tab onto the dimmed backdrop and out of the modal (WCAG 2.4.3 fail).

**Changes to `components/dashboard/guru/guru-panel.tsx`**

- Full **Tab / Shift+Tab wrap** trap scoped to the sheet (`sheetRef`): at the last focusable, Tab → first; at the first, Shift+Tab → last; if focus ever lands outside the sheet, it's pulled back in. Visibility-filtered via `offsetParent` (real layout).
- Backdrop `<button>` made `tabIndex={-1}` + `aria-hidden="true"` — click-to-close still works, but it's out of the tab order and the a11y tree.
- **Focus restored to the launcher** ("Ask Guru") when the panel closes (`launcherRef`).
- Kept Esc-to-close and focus-composer-on-open.

## In-browser verification (real Chromium)

New assertion suite `e2e/qa/guru-focus-trap.spec.ts` + `playwright.a11y.config.ts` (uses the QA learner session; `?guru=1` opens the panel on the lesson route). jsdom can't verify this — the trap's visibility filter needs real layout.

```
npx playwright test --config playwright.a11y.config.ts
ok 1 [chrome] › Guru panel traps keyboard focus (WCAG 2.4.3) (3.3s)
1 passed (6.1s)
```

Asserts: Tab from last wraps to first, Shift+Tab from first wraps to last, focus never leaves the sheet across a full Tab cycle (backdrop excluded), Esc closes, focus returns to the launcher.

## Self-assessment (5 lines)

1. Behavioural a11y fix — **no visual change** to the panel; nothing to screenshot beyond the existing UI.
2. Trap is scoped to `sheetRef` (not the dialog), so the backdrop sibling is structurally excluded — belt (tabIndex/aria-hidden) and braces (scope).
3. `prefers-reduced-motion` untouched (no motion added); works in both enrolled and not-enrolled composer states.
4. Proven in a real browser, not asserted by inspection — the spec is reusable and CI-ready (separate config, won't disturb the capture harness).
5. `offsetParent` filter tolerates the dynamic message list; empty/typing/citation states all keep ≥1 focusable (Close X always present).
