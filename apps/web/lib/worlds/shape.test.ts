import { beforeEach, describe, expect, it, vi } from "vitest";
import { PREBUILT_WORLDS } from "@/lib/worlds/shattered-reaches";

const mocks = vi.hoisted(() => ({
  listPublicWorlds: vi.fn(),
  seedPrebuiltWorldsIfNeeded: vi.fn(),
}));

vi.mock("@/lib/db/queries/worlds", () => ({
  listPublicWorlds: mocks.listPublicWorlds,
  seedPrebuiltWorldsIfNeeded: mocks.seedPrebuiltWorldsIfNeeded,
}));

import { loadPublicWorlds } from "./shape";

function row(id: string, isPrebuilt: boolean) {
  return {
    id,
    name: id,
    description: "",
    genre: "fantasy",
    tone: "dark",
    isPrebuilt,
    imageUrl: null,
    libraryItem: null,
    owner: null,
    createdAt: new Date(0),
  };
}

const prebuiltRows = (count: number) => PREBUILT_WORLDS.slice(0, count).map((w) => row(w.id, true));

describe("loadPublicWorlds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.seedPrebuiltWorldsIfNeeded.mockResolvedValue(undefined);
  });

  it("seeds when some prebuilt worlds have no row yet", async () => {
    expect(PREBUILT_WORLDS.length).toBeGreaterThan(1);
    mocks.listPublicWorlds
      .mockResolvedValueOnce(prebuiltRows(PREBUILT_WORLDS.length - 1))
      .mockResolvedValueOnce(prebuiltRows(PREBUILT_WORLDS.length));

    const worlds = await loadPublicWorlds();

    expect(mocks.seedPrebuiltWorldsIfNeeded).toHaveBeenCalledTimes(1);
    expect(worlds.map((w) => w.id)).toEqual(PREBUILT_WORLDS.map((w) => w.id));
  });

  it("seeds an empty database", async () => {
    mocks.listPublicWorlds.mockResolvedValueOnce([row("player-world", false)]).mockResolvedValueOnce(prebuiltRows(PREBUILT_WORLDS.length));

    await loadPublicWorlds();

    expect(mocks.seedPrebuiltWorldsIfNeeded).toHaveBeenCalledTimes(1);
  });

  it("does not seed when every prebuilt world has a row", async () => {
    mocks.listPublicWorlds.mockResolvedValue([...prebuiltRows(PREBUILT_WORLDS.length), row("player-world", false)]);

    const worlds = await loadPublicWorlds();

    expect(mocks.seedPrebuiltWorldsIfNeeded).not.toHaveBeenCalled();
    expect(worlds).toHaveLength(PREBUILT_WORLDS.length + 1);
  });
});
