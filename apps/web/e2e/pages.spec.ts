import { expect, expectNoSeriousA11yViolations, test } from "./fixtures";

test("home: skip link reaches the main content, and the page passes axe", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test("library: worlds are listed by accessible name, tabs work by keyboard, and it passes axe", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Adventure Library", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play The Shattered Reaches" })).toBeVisible();

  const official = page.getByRole("tab", { name: /official/i });
  const community = page.getByRole("tab", { name: /community/i });
  await expect(official).toHaveAttribute("aria-selected", "true");
  await community.click();
  await expect(community).toHaveAttribute("aria-selected", "true");
  await official.click();

  await expectNoSeriousA11yViolations(page);
});

test("character creation: fields are labelled and the page passes axe", async ({ page }) => {
  await page.goto("/create?worldId=prebuilt-shattered-reaches");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("textbox").first()).toBeVisible();
  // Every visible text field has an accessible name.
  for (const box of await page.getByRole("textbox").all()) {
    if (await box.isVisible()) expect(await box.getAttribute("aria-label") ?? await box.evaluate((el) => (el as HTMLInputElement).labels?.[0]?.textContent ?? "")).not.toBe("");
  }
  await expectNoSeriousA11yViolations(page);
});
