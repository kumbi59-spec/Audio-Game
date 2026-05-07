import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "playwright*"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@audio-rpg/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});
