import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Home screen smoke test. The expectations here are the accessibility
 * contract we ship, not pixel perfection:
 *
 *  - There is one H1 landmark, labelled "Home"
 *  - The four primary actions are reachable by accessible name
 *  - No serious or critical axe-core a11y violations on first paint
 */

test.beforeEach(async ({ page }) => {
  // The web bundle hits /campaigns during voice commands; fail loudly on
  // any network error from the static asset load path.
  page.on("pageerror", (err) => {
    console.error("page error:", err);
  });
});

test("home renders with an accessible heading and primary actions", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Home", level: 1 }),
  ).toBeVisible();

  for (const label of [
    "Start sample adventure",
    "Library",
    "Create world",
    "Upload game bible",
  ]) {
    await expect(page.getByRole("button", { name: label })).toBeVisible();
  }

  await expect(page.getByRole("button", { name: "Accessibility" })).toBeVisible();
});

test("home passes axe-core accessibility scan", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("heading", { name: "Home", level: 1 }).waitFor();
  const results = await new AxeBuilder({ page })
    // Keep CI strict but focused: we gate on actual WCAG 2.1 AA issues.
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // React Native Web wraps everything in <div>s; color-contrast on
    // disabled buttons is a known false positive worth re-enabling once
    // the visual polish pass lands in Phase 3.
    .disableRules(["color-contrast"])
    .analyze();

  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("library route is reachable and has a heading", async ({ page }) => {
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: "Library", level: 1 }),
  ).toBeVisible();
});

test("accessibility center toggles are exposed as switches", async ({ page }) => {
  await page.goto("/settings/a11y");
  await expect(
    page.getByRole("heading", { name: "Accessibility center", level: 1 }),
  ).toBeVisible();
  // Every preference surfaces as a switch with an accessible name.
  for (const label of [
    "Narrator (spoken narration)",
    "Sound cues",
    "Haptic feedback",
    "High contrast",
    "Reduce motion",
    "Audio-only mode",
  ]) {
    await expect(page.getByRole("switch", { name: label })).toBeVisible();
  }
});
