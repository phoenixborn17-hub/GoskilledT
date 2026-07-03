import { defineConfig, configDefaults } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    // Playwright specs under e2e/ use the Playwright runner — keep them out of Vitest's glob
    // (vitest's default include matches *.spec.ts too).
    exclude: [...configDefaults.exclude, "e2e/**"],
    setupFiles: ["./tests/setup-env.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
