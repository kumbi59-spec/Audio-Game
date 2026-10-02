import { expect, test } from "./fixtures";

test("play: with no game in progress it sends the player to the library", async ({ page }) => {
  await page.goto("/play");
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole("heading", { name: "Adventure Library", level: 1 })).toBeVisible();
});
