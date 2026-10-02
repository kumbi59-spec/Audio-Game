import { defineConfig, devices } from "@playwright/test";

/**
 * Accessibility smoke suite for the web app. Builds and serves the
 * production bundle, then drives the main flows with Playwright and scans
 * them with axe-core.
 *
 * Hermetic by design: no database (the library falls back to the built-in
 * worlds, and session saving is best-effort), no AI provider (the game API
 * is mocked per test), and third-party requests are blocked (see
 * e2e/fixtures.ts).
 */
const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: process.env["CI"] ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    // Lets a local run use an already-installed Chromium; CI installs the
    // matching build with `test:e2e:install`.
    ...(process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"]
      ? { launchOptions: { executablePath: process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"] } }
      : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next build && pnpm exec next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env["CI"],
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // Unreachable on purpose: pages must work without a database.
      DATABASE_URL: "postgresql://e2e:e2e@127.0.0.1:1/e2e",
      AUTH_SECRET: "e2e-only-secret-not-for-production-use",
      NEXTAUTH_URL: baseURL,
      NEXT_PUBLIC_ADSTERRA_DISABLED: "1",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
