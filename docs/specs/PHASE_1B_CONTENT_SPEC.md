# PHASE 1B — Public Website Content Unblock (FROZEN SPEC)

**Status:** FROZEN · Authored by Fable from the answered Living Founder Profile v1.0 (Genesis/04_GPS, outside this repo — this file is the in-repo mirror and is authoritative for implementation).
**Tier:** B · **Rule:** use all copy VERBATIM (implementation executes, never invents). Mark temporary values `// REPLACE:`.

## 1. /about — complete it

**a. "Message from the Founder"** (replaces the founder-story slot). Quote card — *Ashish Sangwal, Founder & CEO*:
> "GoSkilled was founded with one clear vision — to make practical, industry-ready education accessible to everyone. We believe real skills create real opportunities, and learning should lead to confidence, growth, and long-term success — not unrealistic promises. Every decision we make is guided by trust, transparency, and helping learners build skills that truly matter."

**b. "Founding Team" section:** Ashish Sangwal — Founder & CEO · Neha — Co-Founder & Operations · Aniket — Partner. Avatars = branded **monogram** components (initials on green/gold gradient, consistent style) — **NO photos, NO AI faces** (Fable override, trust rule). Layout must allow real photos to swap in later without redesign.

**c. Company facts strip:** "GoSkilled is a brand of EDZERA LLP · Founded 2025". Do NOT show office city or other team members.

**d. "The gap we exist to close" section:**
> Every year, millions of students graduate with degrees but struggle to find meaningful opportunities, because the gap between education and industry keeps growing. GoSkilled was created to bridge that gap — practical skills, real confidence, honest guidance.

## 2. /contact — complete it
Email `goskilled.in@gmail.com` (`// REPLACE: temp`) · WhatsApp `+91 85728 87888` (`// REPLACE: temp`) · Office address: omit block (`// REPLACE: pending`) · Business hours: Mon–Sat, 10:00–18:00 IST (`// REPLACE: confirm`) · existing form stays primary.

## 3. /faq — render the 3 pending answers
- **"What language are the courses in?"** → "Courses are taught in simple Hinglish — the way you actually speak — with supporting resources in English. The website is currently in English; a full Hinglish version is planned."
- **"Do I get a certificate?"** → "Yes. Complete your course's required progress and all mandatory assignments, and you'll receive a digital GoSkilled Course Completion Certificate with a unique verification ID and downloadable PDF.* (*Detailed eligibility terms on the Terms page.)"
- **"When are the live sessions?"** → "Every Friday: Live Skill Training for enrolled learners. Every Sunday: a free Introduction Webinar for new learners — what GoSkilled is, the learning roadmap, packages, and how to get started. Registered users get announcements if timings change."

## 4. /webinar — two-session model
Sunday **Free Introduction Webinar** (primary, registration CTA — for new learners) + Friday **Live Skill Training** (for enrolled learners, links to /login). Registration flow unchanged.

## 5. Founding Batch (homepage section + /packages note)
Headline copy stays; add: "Exclusive Founding Batch pricing — available to a limited number of founding learners." **NO percentages, NO commission mentions anywhere** (pending decision D-30).

## 6. Brand statement placement
Footer tagline + /about closing line:
> "We will never sell dreams. We will help you build skills that create opportunities."

## 7. Close-out
Module close-out report per CLAUDE.md. After this, Public Website BLOCKED items reduce to: social links (EXTERNAL) + real photos/contact finals (REPLACE-flagged, non-blocking). Quality bar: typecheck/tests/build green, Lighthouse A11y 100 + contrast PASS on changed pages, D-29 sweep, conventional commits, merge no-ff after report.
