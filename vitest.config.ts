import { defineConfig, configDefaults } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  // The app tsconfig sets jsx:"preserve" (Next/SWC transforms JSX at build). Vitest transforms via
  // esbuild, which would leave preserved JSX in place → runtime error when a test imports a .tsx
  // component. Use the automatic runtime for tests only. No-op for the existing JSX-free .ts tests.
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  test: {
    // Playwright specs under e2e/ use the Playwright runner — keep them out of Vitest's glob
    // (vitest's default include matches *.spec.ts too).
    exclude: [...configDefaults.exclude, "e2e/**"],
    setupFiles: ["./tests/setup-env.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
