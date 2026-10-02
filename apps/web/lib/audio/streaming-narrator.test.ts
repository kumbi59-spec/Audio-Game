import { describe, expect, it, vi } from "vitest";
import { findSegmentCut, StreamingNarrator, type StreamingNarratorOptions } from "./streaming-narrator";

const tick = () => new Promise((r) => setTimeout(r, 0));

/** A speaker whose segments finish only when the test says so. */
function controlledSpeaker() {
  const spoken: string[] = [];
  const pending: Array<() => void> = [];
  const speakSegment = vi.fn((text: string) => {
    spoken.push(text);
    return new Promise<void>((resolve) => pending.push(resolve));
  });
  const finishCurrent = async () => {
    pending.shift()?.();
    await tick();
  };
  return { spoken, speakSegment, finishCurrent };
}

function narrator(opts: Partial<StreamingNarratorOptions> & Pick<StreamingNarratorOptions, "speakSegment">) {
  let stops = 0;
  const session = { begin: vi.fn(), end: vi.fn() };
  const n = new StreamingNarrator({
    minFirstSegmentChars: 20,
    stopCount: () => stops,
    narrationSession: session,
    ...opts,
  });
  return { n, session, stopSpeech: () => { stops += 1; } };
}

describe("findSegmentCut", () => {
  it("cuts after a sentence end, never inside an open quote", () => {
    const text = '[Voss]: "Halt. Who goes there?" He waits. The rain';
    expect(findSegmentCut(text, "first")).toBe(text.indexOf("He"));
    expect(findSegmentCut(text, "last")).toBe(text.indexOf("The rain"));
  });

  it("respects the minimum length and reports no cut when there is none", () => {
    expect(findSegmentCut("Hi. There is more to say. And", "first", 10)).toBe("Hi. There is more to say. ".length);
    expect(findSegmentCut("No sentence end yet", "last")).toBe(-1);
    expect(findSegmentCut('She says "Wait. Then', "last")).toBe(-1);
  });
});

describe("StreamingNarrator", () => {
  it("starts speaking as soon as the first full sentence arrives", async () => {
    const speaker = controlledSpeaker();
    const { n } = narrator({ speakSegment: speaker.speakSegment });

    n.push("The rain falls hard on the cobbles. A door");
    await tick();

    expect(speaker.spoken).toEqual(["The rain falls hard on the cobbles."]);
    expect(n.committedText).toBe("The rain falls hard on the cobbles. ");
  });

  it("batches everything that arrived while the previous segment played", async () => {
    const speaker = controlledSpeaker();
    const { n } = narrator({ speakSegment: speaker.speakSegment });

    n.push("The rain falls hard on the cobbles. ");
    await tick();
    n.push("A door bangs. Someone shouts. Then");
    await speaker.finishCurrent();

    expect(speaker.spoken).toEqual(["The rain falls hard on the cobbles.", "A door bangs. Someone shouts."]);
  });

  it("speaks the rest it is given on finish, then resolves done", async () => {
    const speaker = controlledSpeaker();
    const { n, session } = narrator({ speakSegment: speaker.speakSegment });

    n.push("The rain falls hard on the cobbles. A door");
    await tick();
    const done = n.finish(' bangs. [Voss]: "Halt."');
    await speaker.finishCurrent();
    await speaker.finishCurrent();
    await done;

    expect(speaker.spoken).toEqual(["The rain falls hard on the cobbles.", 'bangs. [Voss]: "Halt."']);
    expect(session.begin).toHaveBeenCalledTimes(1);
    expect(session.end).toHaveBeenCalledTimes(1);
  });

  it("speaks a narration that never streamed when finished", async () => {
    const speakSegment = vi.fn(async () => {});
    const { n } = narrator({ speakSegment });
    await n.finish("All at once.");
    expect(speakSegment).toHaveBeenCalledWith("All at once.", expect.any(AbortSignal));
  });

  it("holds a segment canSpeak rejects until nudged or finished", async () => {
    const speaker = controlledSpeaker();
    let known = false;
    const { n } = narrator({ speakSegment: speaker.speakSegment, canSpeak: () => known });

    n.push('[Voss]: "Halt, stranger." He waits. ');
    await tick();
    expect(speaker.spoken).toEqual([]);

    known = true;
    n.nudge();
    await tick();
    expect(speaker.spoken).toEqual(['[Voss]: "Halt, stranger."']);
  });

  it("stops between segments when speech is stopped", async () => {
    const speaker = controlledSpeaker();
    const { n, stopSpeech } = narrator({ speakSegment: speaker.speakSegment });

    n.push("The rain falls hard on the cobbles. ");
    await tick();
    n.push("A door bangs. ");
    stopSpeech();
    await speaker.finishCurrent();
    await n.finish("More.");

    expect(speaker.spoken).toEqual(["The rain falls hard on the cobbles."]);
    expect(n.cancelled).toBe(true);
  });

  it("cancel aborts the current segment's signal and ignores later text", async () => {
    let signal: AbortSignal | undefined;
    const speakSegment = vi.fn((_: string, s: AbortSignal) => {
      signal = s;
      return new Promise<void>((resolve) => s.addEventListener("abort", () => resolve()));
    });
    const { n } = narrator({ speakSegment });

    n.push("The rain falls hard on the cobbles. ");
    await tick();
    n.cancel();
    n.push("Ignored sentence. ");
    await n.done;

    expect(signal?.aborted).toBe(true);
    expect(speakSegment).toHaveBeenCalledTimes(1);
  });

  it("keeps going when one segment fails to play", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const speakSegment = vi.fn()
      .mockRejectedValueOnce(new Error("tts down"))
      .mockResolvedValue(undefined);
    const { n } = narrator({ speakSegment });

    n.push("The rain falls hard on the cobbles. ");
    await n.finish("A door bangs.");

    expect(speakSegment.mock.calls.map((c) => c[0])).toEqual(["The rain falls hard on the cobbles.", "A door bangs."]);
    errors.mockRestore();
  });
});
