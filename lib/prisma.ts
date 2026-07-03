// Prisma client singleton (Next.js dev-safe — avoids exhausting connections on HMR).
import { PrismaClient } from "./generated/prisma";

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

export const prisma = globalForPrisma.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;
