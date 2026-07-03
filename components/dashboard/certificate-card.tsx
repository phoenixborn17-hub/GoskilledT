// Certificate slot for the Progress tab (GPS-M2 §2.4). Honest, non-manipulative, D-29-clean
// (a certificate is proof of skill — never framed as income). Three states:
//   • issued        → "Certificate earned" + public verify link
//   • 100%, none yet → all lessons done; certificate follows once assignments are complete
//   • below 100%     → honest requirement text
import Link from "next/link";
import { Award, CircleDashed } from "lucide-react";

export function CertificateCard({
  percent,
  certificate,
}: {
  percent: number;
  certificate: { serial: string; issuedAt: Date } | null;
}) {
  if (certificate) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand/5 p-3">
        <Award className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-charcoal">
            Certificate earned
          </p>
          <Link
            href={`/verify/${certificate.serial}`}
            className="text-sm font-semibold text-brand hover:underline"
          >
            View &amp; verify →
          </Link>
        </div>
      </div>
    );
  }

  const text =
    percent === 100
      ? "All lessons complete — your certificate is issued once the mandatory assignments are done."
      : "Complete all lessons and the mandatory assignments to earn your certificate.";

  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl bg-charcoal/5 p-3">
      <CircleDashed
        className="mt-0.5 h-5 w-5 shrink-0 text-muted"
        aria-hidden
      />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
