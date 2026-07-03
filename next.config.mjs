/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prisma client is generated to lib/generated/prisma; keep it external to the server bundle.
  serverExternalPackages: ["@prisma/client", "razorpay"],
};

export default nextConfig;
