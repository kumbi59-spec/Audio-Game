/** One server-sent event from the game API, with its JSON data parsed. */
export interface SseEvent {
  event: string;
  data: unknown;
}

/**
 * Turns the game API's text/event-stream body into events. Feed it chunks
 * as they arrive; an event split across chunks is held until it's complete.
 * Each event is `event: name` then `data: {json}` then a blank line. An event
 * whose data isn't valid JSON is dropped rather than ending the turn.
 */
export class SseParser {
  private buffer = "";
  private eventType = "";
  private dataLine = "";
  private readonly decoder = new TextDecoder();

  push(chunk: Uint8Array | string): SseEvent[] {
    this.buffer += typeof chunk === "string" ? chunk : this.decoder.decode(chunk, { stream: true });
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() ?? "";

    const events: SseEvent[] = [];
    for (const raw of lines) {
      const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
      if (line.startsWith("event: ")) {
        this.eventType = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        this.dataLine = line.slice(6).trim();
      } else if (line === "" && this.eventType && this.dataLine) {
        try {
          events.push({ event: this.eventType, data: JSON.parse(this.dataLine) as unknown });
        } catch {
          console.error("[sse] dropped an event with malformed data:", this.eventType);
        }
        this.eventType = "";
        this.dataLine = "";
      }
    }
    return events;
  }
}
