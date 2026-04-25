import { defineConfig, devices } from "@playwright/test";

/**
 * Web E2E smoke suite. Builds the Expo web bundle into `web-build/`,
 * serves it on :8080 via http-server, and drives it with Playwright.
 *
 * Kept intentionally small: the goal is "proves the web bundle builds,
 * renders, and passes a11y scans on the critical landmarks". Full
 * interaction tests are cheaper to write against the REST/WS layer
 * (already covered in apps/api/src/__tests__).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: process.env["CI"] ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:8080",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command:
      "pnpm web:export && pnpm web:serve",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
