# PRODUCT_DEBT — UX & Product-Quality Backlog

> **Engineering debt lives in code comments + tickets. Launch dependencies live in LAUNCH_CONFIG.md. THIS file is product debt:** confusing UX, extra clicks, weak copy, missing delight, trust gaps — things that work but aren't *premium* yet (DESIGN_DIRECTION north-star test).
> Rules: one row per item · anyone (founder, Fable, Claude Code, QA) may add · sourced from real walkthroughs/screenshots, not speculation · founder prioritizes · items graduate to tickets, never build directly from here.

**Severity:** S1 blocks trust/comprehension · S2 friction/extra clicks · S3 polish/delight.
**Source:** FW = founder walkthrough · QA = QA-01 screenshots · FR = Fable review · U = user feedback (post-launch).

| # | Surface | Issue | Severity | Source | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | /checkout + /login | Deferred UX pass: payment retry/recovery page, success confetti polish, resend fallback copy | S2 | FR (M1 close-out) | OPEN | Tied to live-provider pass (LC #19/#21) |
| 2 | /register /welcome | Placeholder Hinglish copy, clearly non-final | S2 | FR (Day-0) | OPEN | LC #34 — founder copy set |
| 3 | Hub earn card | Pre-D-01 invite copy is compliant but flat — needs warmth without earn-language | S3 | FR | OPEN | LC #17 copy slots |
| 4 | /admin/catalog | Founder-workflow unaudited: how many clicks course→module→lesson→publish? Video ID entry is manual paste | S2 | CTO review (2026-07-05) | OPEN | Audit in founder walkthrough; direct-upload = future |
| 5 | /admin/webinar | Schedule form field-count unaudited — target: session created ≤1 min | S2 | CTO review | OPEN | Founder walkthrough |
| 6 | Certificates | Functional serial page; no visual template/PDF yet — proof exists, pride doesn't | S2 | FR (M2) | OPEN | LC #14 (founder asset) + render ticket |
| 7 | All dashboards | Motion/delight budget largely unspent outside Lesson-0 confetti — "one small moment of delight" per screen unmet | S3 | DESIGN_DIRECTION audit | OPEN | Post-QA-01 pass |
| 8 | /courses detail | Generic outcomes copy marked draft | S2 | FR (M1) | OPEN | LC #13 |

**Changelog:** 2026-07-05 — created (founder CTO-review directive); seeded with 8 known items from module close-outs + reviews.
