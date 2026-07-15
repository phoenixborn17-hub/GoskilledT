// Shared "← Back to X" affordance (overnight-2, back-navigation). Mirrors the existing admin
// detail-page pattern (app/admin/wallet/[userId]/page.tsx etc.) so dashboard deep pages get the
// same low-key, consistent back link.
import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-block text-sm text-ink-muted hover:text-ink"
    >
      ← {label}
    </Link>
  );
}
