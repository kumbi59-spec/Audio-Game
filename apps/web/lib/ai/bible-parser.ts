import Anthropic from "@anthropic-ai/sdk";
import type { ParsedGameBible } from "@/types/world";
import { BIBLE_PARSE_SYSTEM } from "./prompts/bible-parse";
import { prisma } from "@/lib/db";

const client = new Anthropic();
const MODEL = process.env["CLAUDE_GM_MODEL"] ?? "claude-sonnet-4-6";
const MAX_INPUT_CHARS = 80_000;
const MAX_TOKENS = 4096;

/**
 * Pass raw extracted text through Claude and return a structured ParsedGameBible.
 * Throws if Claude returns malformed JSON.
 */
export async function parseGameBible(rawText: string): Promise<ParsedGameBible> {
  const truncated =
    rawText.length > MAX_INPUT_CHARS
      ? rawText.slice(0, MAX_INPUT_CHARS) +
        "\n\n[NOTE: Text truncated at 80,000 characters for processing.]"
      : rawText;

  const response = await client.messages.create({
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

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Claude sometimes wraps JSON in a code fence — strip it
  const jsonText = block.text
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  let parsed: ParsedGameBible;
  try {
    parsed = JSON.parse(jsonText) as ParsedGameBible;
  } catch {
    throw new Error("Claude returned invalid JSON — please try a different file or rephrase your Game Bible.");
  }

  return parsed;
}

/**
 * Map a ParsedGameBible's ambientMood to the closest AmbientTrack enum value.
 */
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

/**
 * Build a GM system prompt string from a ParsedGameBible.
 */
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
    `Campaign Hooks:\n${hooksText}`,
    bible.rulesNotes ? `\nSpecial Rules:\n${bible.rulesNotes}` : "",
    "",
    `Opening Scenario:\n${bible.openingNarration}`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

/**
 * Create a World (with locations, NPCs, LibraryItem, GameBible) from a
 * ParsedGameBible. Returns the new World's ID.
 */
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
      rawText: rawText.slice(0, 200_000), // cap storage to 200k chars
      parsedData: JSON.stringify(bible),
      processingStatus: "complete",
      uploaderId: guestId,
    },
  });

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
