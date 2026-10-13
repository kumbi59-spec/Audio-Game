import { beforeEach, describe, expect, it, vi } from "vitest";

const worker = vi.hoisted(() => ({ reply: null as unknown }));

vi.mock("node:worker_threads", async () => {
  const { EventEmitter } = await import("node:events");
  class FakeWorker extends EventEmitter {
    constructor() {
      super();
      queueMicrotask(() => {
        this.emit("message", worker.reply);
        this.emit("exit", 0);
      });
    }
    terminate() {
      return Promise.resolve(0);
    }
  }
  return { Worker: FakeWorker };
});

import { runParserInSandbox } from "./sandbox";
import { UploadParseErrorCode } from "../guards";

describe("runParserInSandbox", () => {
  beforeEach(() => {
    worker.reply = null;
  });

  it("resolves a PDF with no text layer as an empty (successful) parse, not a quarantine", async () => {
    worker.reply = { ok: true, text: "" };
    await expect(runParserInSandbox("pdf", Buffer.from("%PDF-1.4"))).resolves.toBe("");
  });

  it("returns the parsed text", async () => {
    worker.reply = { ok: true, text: "The Docks of Saltglass" };
    await expect(runParserInSandbox("docx", Buffer.from("PK"))).resolves.toBe("The Docks of Saltglass");
  });

  it("still rejects a parser failure", async () => {
    worker.reply = { ok: false, error: "bad xref table" };
    await expect(runParserInSandbox("pdf", Buffer.from("%PDF-1.4"))).rejects.toMatchObject({
      code: UploadParseErrorCode.ParserFailed,
    });
  });
});
