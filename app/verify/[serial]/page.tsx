// Public certificate verification (GPS-M2 §2.6). Anti-fake proof page — shows ONLY name + course
// + date. Rate-limited by IP (serials are unguessable, so enumeration is already impractical;
// this is defence-in-depth). noindex (proof pages aren't search results). No auth required.
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ShieldCheck, ShieldX, Clock } from "lucide-react";
import { getCertificateBySerial } from "../../../lib/lms/certificate";
import { rateLimit } from "../../../lib/rate-limit";
import { SiteHeader } from "../../../components/marketing/site-header";
import { SiteFooter } from "../../../components/marketing/site-footer";
import { Card, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ShareCertButton } from "../../../components/dashboard/share-cert-button";

export const metadata: Metadata = {
  title: "Verify certificate",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-16">{children}</main>
      <SiteFooter />
    </>
  );
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;

  // Rate-limit lookups per IP (anti-enumeration defence-in-depth).
  const rl = rateLimit(`verify:${await clientIp()}`, {
    max: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return (
      <Shell>
        <Card className="text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal/5"
            aria-hidden
          >
            <Clock className="h-6 w-6 text-muted" />
          </div>
          <CardTitle>Too many checks</CardTitle>
          <CardDescription>Please wait a moment and try again.</CardDescription>
        </Card>
      </Shell>
    );
  }

  const result = await getCertificateBySerial(serial);

  if (!result.valid) {
    return (
      <Shell>
        <Card className="text-center">
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-charcoal/5"
            aria-hidden
          >
            <ShieldX className="h-7 w-7 text-muted" />
          </div>
          <CardTitle>No certificate found</CardTitle>
          <CardDescription>
            We couldn&apos;t verify a GoSkilled certificate for this code. Check
            the code and try again.
          </CardDescription>
          <div className="mx-auto mt-5 max-w-xs">
            <Link href="/courses">
              <Button variant="outline">Explore courses</Button>
            </Link>
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand"
            aria-hidden
          >
            <ShieldCheck className="h-7 w-7" />
          </div>
          <CardTitle>Certificate verified</CardTitle>
          <CardDescription>
            This is a genuine GoSkilled certificate.
          </CardDescription>
        </div>

        <dl className="mt-6 space-y-3 border-t border-line/5 pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Awarded to</dt>
            <dd className="font-medium text-ink">
              {result.learnerName || "GoSkilled Learner"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Course</dt>
            <dd className="font-medium text-ink">{result.courseTitle}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Issued</dt>
            <dd className="font-medium text-ink">
              {result.issuedAt ? formatDate(result.issuedAt) : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Certificate ID</dt>
            <dd className="font-mono text-ink">{serial}</dd>
          </div>
        </dl>

        {/* Share this credential (GPS-M5 §2.7) — compliant social proof. */}
        <div className="mt-6 flex justify-center">
          <ShareCertButton
            serial={serial}
            courseTitle={result.courseTitle ?? "GoSkilled course"}
          />
        </div>
      </Card>

      <p className="mt-6 text-center text-sm text-muted">
        Want to earn one?{" "}
        <Link href="/courses" className="font-semibold text-brand">
          Explore courses
        </Link>
      </p>
    </Shell>
  );
}
