import { expect, expectNoSeriousA11yViolations, test } from "./fixtures";

/** Games saved to the account, as GET /api/game/session lists them. */
const saves = [
  { id: "s-reaches", worldId: "w1", worldName: "The Shattered Reaches", worldGenre: "Dark fantasy", lastPlayedAt: "2026-10-01T10:00:00Z", turnCount: 27 },
  { id: "s-seal", worldId: "w2", worldName: "Hollow Seal", worldGenre: "Mystery", lastPlayedAt: "2026-09-07T10:00:00Z", turnCount: 41 },
];

test("library: a saved game can be deleted, after a confirm that defaults to keeping it", async ({ page }) => {
  const deleted: string[] = [];
  await page.route("**/api/game/session**", async (route) => {
    const req = route.request();
    if (req.method() === "DELETE") {
      deleted.push(new URL(req.url()).searchParams.get("sessionId") ?? "");
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: saves });
  });

  await page.goto("/library");
  const list = page.getByRole("region", { name: "Saved to your account" });
  await expect(list.getByText("Hollow Seal")).toBeVisible();
  const deleteSeal = list.getByRole("button", { name: "Delete save: Hollow Seal, turn 41" });

  // Backing out keeps the save, and focus returns to Delete.
  await deleteSeal.click();
  await expect(list.getByRole("button", { name: "Keep it" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(deleteSeal).toBeFocused();
  expect(deleted).toEqual([]);

  // Confirming deletes it and puts focus on the list's heading.
  await deleteSeal.click();
  await expectNoSeriousA11yViolations(page);
  await list.getByRole("button", { name: "Yes, delete" }).click();
  await expect(list.getByText("Hollow Seal")).toHaveCount(0);
  await expect(list.getByRole("heading", { name: "Saved to your account" })).toBeFocused();
  expect(deleted).toEqual(["s-seal"]);
  await expect(list.getByText("The Shattered Reaches")).toBeVisible();
});
