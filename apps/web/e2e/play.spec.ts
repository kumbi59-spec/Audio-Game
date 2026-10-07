import { expect, expectNoSeriousA11yViolations, test } from "./fixtures";

/** A game in progress, as the play screen finds it in browser storage. */
const savedGame = {
  state: {
    session: {
      id: "e2e-session",
      worldId: "prebuilt-shattered-reaches",
      characterId: "e2e-char",
      status: "active",
      turnCount: 1,
      currentLocationId: "loc-thornhaven-docks",
      timeOfDay: "night",
      weather: "rain",
      globalFlags: {},
      npcStates: {},
      memorySummary: "",
      history: [
        { role: "user", content: "Look around" },
        { role: "assistant", content: '{"narration":"Rain hammers the docks."}' },
      ],
      narrationLog: [
        { id: "n1", text: "Rain hammers the docks. A gate stands shut ahead.", type: "narration", timestamp: new Date(0).toISOString() },
      ],
      choices: ["Open the gate", "Wait in the shadows", "Do something else"],
      isGenerating: false,
      achievements: [],
      relationships: [],
      codex: [],
    },
    character: {
      id: "e2e-char",
      name: "Mara",
      class: "warrior",
      backstory: "A sellsword.",
      stats: { hp: 20, maxHp: 20, strength: 14, dexterity: 10, intelligence: 10, charisma: 10, level: 1, experience: 0 },
      inventory: [],
      quests: [],
    },
    world: {
      id: "prebuilt-shattered-reaches",
      name: "The Shattered Reaches",
      description: "",
      genre: "Dark fantasy",
      tone: "Grim",
      systemPrompt: "",
      isPrebuilt: true,
      locations: [
        { id: "loc-thornhaven-docks", name: "Thornhaven Docks", description: "", shortDesc: "Rain-lashed docks", connectedTo: [], properties: {} },
      ],
      npcs: [],
    },
    dbSessionId: null,
    savedCampaigns: [],
  },
  version: 0,
};

function sse(events: Array<[string, unknown]>): string {
  return events.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("");
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((game) => {
    window.localStorage.setItem("echoquest-game", JSON.stringify(game));
  }, savedGame);
});

test("play: a turn can be taken by keyboard, and the screen passes axe", async ({ page }) => {
  let sentAction: { content: string; type: string } | null = null;
  let sentWorld: unknown = null;
  await page.route("**/api/game/action", async (route) => {
    const body = route.request().postDataJSON() as { action: { content: string; type: string }; world: unknown };
    sentAction = body.action;
    sentWorld = body.world;
    const reply = {
      soundCue: "door_open",
      speakers: [],
      narration: "The gate groans open onto a flooded courtyard.",
      choices: ["Step into the courtyard", "Close the gate", "Do something else"],
    };
    await route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream" },
      body: sse([
        ["narration_chunk", { text: JSON.stringify(reply) }],
        ["narration_delta", { text: reply.narration }],
        ["sound_cue", { cue: "door_open" }],
        ["state_change", { hp: -2 }],
        ["choices_ready", { choices: reply.choices, narration: reply.narration, npcAction: null }],
        ["done", null],
      ]),
    });
  });

  await page.goto("/play");
  const story = page.getByRole("region", { name: "Story narration" });
  await expect(story).toContainText("A gate stands shut ahead.");
  const firstChoice = page.getByRole("button", { name: "Option 1: Open the gate" });
  await expect(firstChoice).toBeVisible();

  await expectNoSeriousA11yViolations(page);

  // Number keys pick a choice, as the keyboard shortcuts promise.
  await page.locator("body").press("1");
  await expect(story).toContainText("The gate groans open onto a flooded courtyard.");
  await expect(page.getByRole("button", { name: "Option 1: Step into the courtyard" })).toBeVisible();
  expect(sentAction).toMatchObject({ type: "choice", content: "Open the gate" });
  // Only the world's id is sent; the server loads the world itself.
  expect(sentWorld).toEqual({ id: "prebuilt-shattered-reaches" });

  await expectNoSeriousA11yViolations(page);
});

test("play: a failed turn is reported and nothing is lost", async ({ page }) => {
  await page.route("**/api/game/action", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream" },
      body: sse([
        ["narration_reset", { reason: "fallback" }],
        ["error", { message: "The narrator connection is unstable.", degraded: true }],
        ["choices_ready", { choices: ["Explore carefully"], narration: "x", npcAction: null }],
        ["done", null],
      ]),
    }),
  );

  await page.goto("/play");
  await page.getByRole("button", { name: "Option 1: Open the gate" }).click();
  const story = page.getByRole("region", { name: "Story narration" });
  await expect(story).toContainText("The narrator connection is unstable.");
  // The turn was rolled back: the same choices are still offered.
  await expect(page.getByRole("button", { name: "Option 1: Open the gate" })).toBeEnabled();
});

test("play: reloading keeps the game in progress", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("button", { name: "Option 1: Open the gate" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Option 1: Open the gate" })).toBeVisible();
  await expect(page).toHaveURL(/\/play$/);
});

test("play: ? lists the keyboard shortcuts, and Help (H) lists them too", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("button", { name: "Option 1: Open the gate" })).toBeVisible();

  await page.locator("body").press("?");
  const list = page.getByRole("dialog", { name: "Keyboard Shortcuts" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("heading", { name: "Keyboard Shortcuts" })).toBeFocused();
  await expect(list).toContainText("Show this list of shortcuts");
  // Game keys stay inactive while the list is open.
  await page.keyboard.press("1");
  await expect(list).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(list).toBeHidden();

  await page.locator("body").press("h");
  const manual = page.getByRole("dialog", { name: "Help / Operations Manual" });
  await expect(manual).toBeVisible();
  await expect(manual.getByRole("heading", { name: "Help / Operations Manual" })).toBeFocused();
  await expect(manual.getByRole("heading", { name: "Keyboard Shortcuts" })).toBeVisible();
  await expect(manual).toContainText("Undo last turn");
  await expectNoSeriousA11yViolations(page);
  await page.keyboard.press("Escape");
  await expect(manual).toBeHidden();
});
