import type { ParsedGameBible } from "@/types/world";
import { BIBLE_PARSE_SYSTEM } from "./prompts/bible-parse";
import { getAnthropicClient } from "./client";
import { prisma } from "@/lib/db";
import { resolveWorldCoverImage } from "@/lib/worlds/cover-art-resolver";

const MODEL = process.env["CLAUDE_GM_MODEL"] ?? "claude-sonnet-4-6";
const MAX_INPUT_CHARS = 80_000;
const MAX_TOKENS = 8192;

export async function parseGameBible(rawText: string): Promise<ParsedGameBible> {
  const truncated =
    rawText.length > MAX_INPUT_CHARS
      ? rawText.slice(0, MAX_INPUT_CHARS) +
        "\n\n[NOTE: Text truncated at 80,000 characters for processing.]"
      : rawText;

  const response = await getAnthropicClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: BIBLE_PARSE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Extract the world data from the following Game Bible text:\n\n${truncated}`,
      },
    ],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "The world description produced too much data for the AI to complete. Try a shorter document (under 5,000 words)."
    );
  }

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Strip code fences Claude sometimes adds
  let jsonText = block.text
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  // If Claude added prose before/after the JSON, extract the object boundaries
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace > 0 || lastBrace < jsonText.length - 1) {
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }
  }

  let parsed: ParsedGameBible;
  try {
    parsed = JSON.parse(jsonText) as ParsedGameBible;
  } catch {
    throw new Error(
      "Claude returned invalid JSON — please try a different file or rephrase your Game Bible."
    );
  }

  return parsed;
}

function mapAmbient(mood: string): string {
  const MAP: Record<string, string> = {
    tavern: "tavern",
    forest_day: "forest_day",
    forest_night: "forest_night",
    dungeon: "dungeon",
    ocean: "ocean",
    city_day: "city_day",
    city_night: "city_night",
    cave: "cave",
    throne_room: "throne_room",
    market: "market",
    forest: "forest_day",
    city: "city_day",
    night: "city_night",
    underground: "dungeon",
    sea: "ocean",
  };
  return MAP[mood.toLowerCase()] ?? "none";
}

function buildSystemPromptFromBible(bible: ParsedGameBible): string {
  const locationList = bible.locations
    .map((l) => `- ${l.name}: ${l.shortDesc}`)
    .join("\n");
  const npcList = bible.npcs
    .map((n) => `- ${n.name} (${n.role}): ${n.personality.slice(0, 120)}`)
    .join("\n");
  const factionList = bible.factions
    .map((f) => `- ${f.name} [${f.disposition}]: ${f.description}`)
    .join("\n");
  const hooksText = bible.campaignHooks.map((h, i) => `${i + 1}. ${h}`).join("\n");

  const classList =
    bible.classes?.length > 0
      ? bible.classes.map((c) => `- ${c.name} (${c.role}): ${c.description}`).join("\n")
      : null;
  const backgroundList =
    bible.backgrounds?.length > 0
      ? bible.backgrounds.map((b) => `- ${b.name}: ${b.description}`).join("\n")
      : null;

  return [
    `WORLD: ${bible.worldName.toUpperCase()}`,
    `Genre: ${bible.genre} | Tone: ${bible.tone}`,
    "",
    bible.systemPromptCore,
    "",
    "Key Locations:",
    locationList,
    "",
    "Key NPCs:",
    npcList,
    "",
    factionList.length > 0 ? `Factions:\n${factionList}` : "",
    "",
    classList ? `Playable Classes:\n${classList}` : "",
    "",
    backgroundList ? `Character Backgrounds:\n${backgroundList}` : "",
    "",
    bible.rulesNotes ? `Game Rules & Mechanics:\n${bible.rulesNotes}` : "",
    "",
    `Campaign Hooks:\n${hooksText}`,
    "",
    `Opening Scenario:\n${bible.openingNarration}`,
  ]
    .filter((l) => l !== undefined && l !== "")
    .join("\n");
}

export async function createWorldFromBible(
  bible: ParsedGameBible,
  guestId: string,
  rawText: string,
  originalFilename: string,
  mimeType: string
): Promise<string> {
  // Unique IDs derived from a timestamp so re-uploads don't conflict
  const stamp = Date.now().toString(36);
  const worldId = `world-${stamp}`;

  const locationIdMap: Record<string, string> = {};
  bible.locations.forEach((l, i) => {
    locationIdMap[l.name] = `loc-${stamp}-${i}`;
  });

  const startingLocId =
    locationIdMap[bible.startingLocation] ??
    Object.values(locationIdMap)[0] ??
    null;

  const gameBible = await prisma.gameBible.create({
    data: {
      originalName: originalFilename,
      mimeType,
      rawText: rawText.slice(0, 200_000),
      parsedData: JSON.stringify(bible),
      processingStatus: "complete",
      uploaderId: guestId,
    },
  });

  const imageUrl = await resolveWorldCoverImage(bible.worldName, bible.genre, bible.tone);

  await prisma.world.create({
    data: {
      id: worldId,
      name: bible.worldName,
      description: bible.synopsis,
      genre: bible.genre,
      tone: bible.tone,
      systemPrompt: buildSystemPromptFromBible(bible),
      isPrebuilt: false,
      isPublic: false,
      imageUrl,
      ownerId: guestId,
      gameBibleId: gameBible.id,
      libraryItem: {
        create: {
          title: bible.worldName,
          description: bible.synopsis,
          genre: bible.genre,
          difficulty: "beginner",
          tags: [bible.genre, bible.tone].join(","),
          sortOrder: 100,
        },
      },
      locations: {
        create: bible.locations.map((l) => ({
          id: locationIdMap[l.name],
          name: l.name,
          description: l.description,
          shortDesc: l.shortDesc,
          ambientSound: mapAmbient(l.ambientMood),
          connectedTo: JSON.stringify(
            l.connections.map((name) => locationIdMap[name] ?? name)
          ),
          properties: "{}",
        })),
      },
      npcs: {
        create: bible.npcs.map((n, i) => ({
          id: `npc-${stamp}-${i}`,
          name: n.name,
          role: n.role,
          personality: n.personality,
          voiceDescription: n.voiceDescription,
          relationship: "neutral" as const,
          isAlive: true,
          locationId: locationIdMap[n.homeLocation] ?? null,
          properties: "{}",
        })),
      },
    },
  });

  return worldId;
}
