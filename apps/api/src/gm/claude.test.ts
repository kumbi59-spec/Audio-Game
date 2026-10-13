import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { SUNKEN_BELL_BIBLE } from "@audio-rpg/shared";
import { classifyProviderError, extractJson, generateGmTurn, generateSceneSummary } from "./claude.js";

const { create, stream } = vi.hoisted(() => ({ create: vi.fn(), stream: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create, stream };
  },
}));

vi.mock("../config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config.js")>();
  return { config: { ...actual.config, ANTHROPIC_API_KEY: "test-key" } };
});

const textReply = (text: string) => ({ content: [{ type: "text", text }] });

describe("extractJson", () => {
  it("falls through to the outer braces when JSON is followed by prose", () => {
    expect(extractJson('{"summary": "The bell rang."}\n\nLet me know if you need more.')).toEqual({
      summary: "The bell rang.",
    });
  });

  it("reads a fenced reply", () => {
    expect(extractJson('Here you go:\n```json\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it("throws when there is no JSON object", () => {
    expect(() => extractJson("no json here")).toThrow("No JSON object found");
  });
});

describe("classifyProviderError", () => {
  it("treats schema and parse failures as malformed output", () => {
    const zodError = z.object({ narration: z.string() }).safeParse({}).error;
    expect(classifyProviderError(zodError)).toBe("malformed_output");
    expect(classifyProviderError(new SyntaxError("Unexpected token } at position 12"))).toBe("malformed_output");
  });

  it("keeps other failures as provider errors", () => {
    expect(classifyProviderError(new Error("provider_down"))).toBe("provider_error");
  });
});

describe("generateSceneSummary", () => {
  it("parses a summary reply that has trailing prose", async () => {
    create.mockResolvedValueOnce(
      textReply('{"summary": "Wren found the bell.", "keyEvents": ["found the bell", 3]}\nHope this helps!'),
    );
    await expect(
      generateSceneSummary({ sceneName: "Harbor", sceneNumber: 1, turns: [] }),
    ).resolves.toEqual({ summary: "Wren found the bell.", keyEvents: ["found the bell"] });
  });
});

describe("generateGmTurn", () => {
  it("passes the abort signal to the streaming request", async () => {
    const turn = {
      narration: "Fog.",
      presented_choices: [{ id: "a", label: "Wait" }],
      accepts_freeform: true,
      state_mutations: [],
      sound_cues: [],
      narration_voice_plan: [],
      scene_ends: false,
    };
    stream.mockReturnValueOnce({
      on: vi.fn(),
      finalMessage: async () => textReply(JSON.stringify(turn)),
    });
    const controller = new AbortController();
    await generateGmTurn({ bible: SUNKEN_BELL_BIBLE, userPrompt: "go", signal: controller.signal });
    expect(stream).toHaveBeenCalledWith(expect.anything(), { signal: controller.signal });
  });
});
