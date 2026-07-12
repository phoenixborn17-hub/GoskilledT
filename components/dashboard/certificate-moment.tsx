"use client";
// GPS-M5 §2.6 — Certificate Earned signature moment (Register 1: earned celebration, one of the six).
// Fires when the course hits 100%. Confetti is reduced-motion-safe (inside <Confetti>); the overlay
// entrance uses the gated .enter class. Pride, never earnings (D-29). Dismissible.
import Link from "next/link";
import { Award, X } from "lucide-react";
import { Confetti } from "../ui/confetti";
import { Button } from "../ui/button";
import { ShareCertButton } from "./share-cert-button";

export function CertificateMoment({
  serial,
  courseTitle,
  onClose,
}: {
  serial: string;
  courseTitle: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-moment-title"
    >
      <Confetti fire />
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-charcoal/50"
      />
      <div className="enter relative w-full max-w-sm rounded-gs-lg bg-surface-raised p-6 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="press absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-charcoal/5"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <span
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-gs-lg bg-gold/20 text-ink"
          aria-hidden
        >
          <Award className="h-8 w-8" />
        </span>
        <h2
          id="cert-moment-title"
          className="font-heading text-2xl font-bold text-ink"
        >
          Certificate earned! 🎉
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-small text-ink-muted">
          Aapne <span className="font-semibold text-ink">{courseTitle}</span>{" "}
          poora complete kiya — shabaash! Ye aapki mehnat ka proof hai.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <ShareCertButton serial={serial} courseTitle={courseTitle} />
          <Link href={`/verify/${serial}`} className="w-full">
            <Button variant="outline">View your certificate</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
