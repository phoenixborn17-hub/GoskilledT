import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prisma client is generated to lib/generated/prisma; keep it external to the server bundle.
  serverExternalPackages: ["@prisma/client", "razorpay"],
  // Pin the build-trace root to the project. Without this, Next infers the root by walking up and
  // (on Windows) globs the user profile, hitting the legacy `Local Settings` junction which throws
  // EPERM and fails the build. Pinning keeps tracing inside the repo where it belongs.
  outputFileTracingRoot: projectRoot,
  // Baseline security headers on every response. Deliberately CONSERVATIVE: no Content-Security-
  // Policy here — a strict CSP must be co-designed with the Razorpay checkout script, Supabase,
  // Cloudflare Stream, PostHog and next/og origins (a wrong CSP silently breaks the money flow),
  // which is a spec'd Tier-A effort, not launch hardening. These headers are safe app-wide.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          // HSTS only takes effect over HTTPS; browsers ignore it on http://localhost.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
