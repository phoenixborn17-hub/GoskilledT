// Flat ESLint config (ESLint 9). Replaces the interactive, now-deprecated `next lint` bootstrap
// so `npm run lint` runs non-interactively in CI. Brings in Next's core-web-vitals + TypeScript
// rules via FlatCompat (eslint-config-next is still eslintrc-style in 15.x).
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "lib/generated/**", // Prisma-generated client — not our source
      "next-env.d.ts", // Next-generated ambient types — not our source
      ".build-home/**",
    ],
  },
];

export default config;
