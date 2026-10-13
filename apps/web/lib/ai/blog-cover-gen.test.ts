import { describe, expect, it } from "vitest";
import { pickScenes } from "./blog-cover-gen";

describe("pickScenes", () => {
  it("ignores cue words buried inside other words", () => {
    // "said" (ai), "image" (mage), "EchoQuest" (quest), "history" (story), "explore" (lore)
    expect(pickScenes("She said the image of EchoQuest history helps you explore.")).toEqual([]);
  });

  it("still matches whole words, plurals and stems", () => {
    const scenes = pickScenes("Worldbuilding for heroes: how AI narrates quests");
    expect(scenes).toHaveLength(3);
    expect(scenes[0]).toContain("leather-bound atlas");
    expect(scenes[1]).toContain("cloaked travelers");
    expect(scenes[2]).toContain("winding mountain road");
  });

  it("matches D&D on its own", () => {
    expect(pickScenes("A D&D night")[0]).toContain("dice, parchment");
  });
});
