import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // React Native's dev flag; tests run like a release build.
  define: { __DEV__: "false" },
  test: {
    environment: "node",
    // e2e/*.spec.ts are Playwright suites, run by `pnpm test:e2e`.
    include: ["src/**/*.test.ts", "app/**/*.test.ts", "serve-spa.test.mjs"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@audio-rpg/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@audio-rpg/gm-engine": path.resolve(__dirname, "../../packages/gm-engine/src/index.ts"),
    },
  },
});
