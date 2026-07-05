# Review Packet — GPS-M5 §2.6 Signature Moments (Tier B, partial — 1 new moment + 5 itemized)

**Branch:** `gps-m5-premium` · **Ticket:** GPS-M5 §2.6 · **Tier:** B · **NOT merged.**
**Spec:** `docs/specs/GPS-M5_Premium_v1.0.md` §2.6 · **Companion:** `gps-m5-2.6-signature-moments.diff`.
**Verification shot:** `docs/qa/GPS-M5/moments/certificate-earned.png` (git-ignored).

## What was built — the Certificate Earned moment (the one NEW moment GPS-M5 introduces)

A course hitting 100% now fires a full **Certificate Earned** signature moment (Register 1, earned
celebration):

- `completeLessonAction` surfaces the freshly-issued `certificateSerial` on the completion that hits 100%.
- `CertificateMoment` (client) — a centred celebration overlay: confetti (**reduced-motion-safe** inside
  `<Confetti>`), gold Award badge, "Certificate earned! 🎉", course name, **Share certificate** (§2.7
  reuse) + **View your certificate** → `/verify/<serial>`, dismissible. Entrance via the gated `.enter`.
- Wired into `LessonPlayer`: final lesson → moment; any other lesson → the existing small confetti win.

**Verified end-to-end:** completed the last lesson of a course → 100% → certificate issued → the moment
fired with the real serial (screenshot). No console/hydration errors.

## §19 review ritual (Certificate Earned)

Register 1 (pride) · Level-2/3 motion concentrated here (confetti + entrance), reduced-motion safe · gold
badge = fill + charcoal (Rule 14) · D-29 (a proof of skill, never earnings) · dismissible + share/verify
paths. **Verdict: meets Design Direction v1.0.**

## The other five moments — itemized, not churned (DR-031)

The spec lists six moments; five already EXIST from closed modules (M1/M2/M3): Homepage hero, Registration
welcome, First-lesson complete, Purchase success, Referral milestone. **DR-031 sequencing** says closed-
module surfaces are not revisited mid-sprint — gaps go to PRODUCT_DEBT for a dedicated Polish Sprint. To
avoid a rushed, quality-degrading pass at the tail of a long build, I shipped the one NEW moment and filed
the five elevations as tracked rows **PRODUCT_DEBT #10–#14** (S3), each scoped to §2.6. This is honest:
the moment framework + the flagship new moment are in; the five elevations are itemized, not faked.

## Self-assessment (5 lines)

1. The Certificate Earned moment is new, premium, reduced-motion-safe, and verified end-to-end.
2. It reuses §2.7 share + the existing Confetti/verify — consistent, no new surface debt.
3. The five existing-moment elevations are explicitly itemized (PRODUCT_DEBT #10–14), not silently skipped.
4. No route/data changes beyond returning the serial; full suite unaffected.
5. Deliberately scoped per DR-031 rather than churning finished M1/M2/M3 surfaces in a marathon turn.

## Tier-B checklist

- [x] `tsc` clean · prettier clean · full suite green
- [x] New moment verified in-browser (100% → cert → moment); reduced-motion safe
- [x] D-29 · gold-contrast · dismissible
- [x] Five remaining elevations itemized (PRODUCT_DEBT #10–14)
- [x] Git commit created on branch — NOT merged
