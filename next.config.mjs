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
};

export default nextConfig;
