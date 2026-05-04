import path from "node:path";
import { Worker } from "node:worker_threads";
import { PARSER_MEMORY_BUDGET_BYTES, PARSER_TIME_BUDGET_MS } from "../constants";
import { UploadParseError, UploadParseErrorCode } from "../guards";

export async function runParserInSandbox(kind: "pdf" | "docx", buffer: Buffer): Promise<string> {
  const workerPath = path.join(process.cwd(), "lib/upload/parsers/worker-entry.js");

  return new Promise<string>((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: { kind, base64: buffer.toString("base64") },
      resourceLimits: {
        maxOldGenerationSizeMb: Math.floor(PARSER_MEMORY_BUDGET_BYTES / 1024 / 1024),
        maxYoungGenerationSizeMb: 32,
      },
    });

    const timer = setTimeout(() => {
      void worker.terminate();
      reject(
        new UploadParseError(
          UploadParseErrorCode.ParserTimeout,
          `${kind} parser exceeded ${PARSER_TIME_BUDGET_MS}ms in sandbox worker`,
          "File parsing exceeded time limits. Try a smaller or simpler document."
        )
      );
    }, PARSER_TIME_BUDGET_MS);

    worker.once("message", (msg: { ok: boolean; text?: string; error?: string }) => {
      clearTimeout(timer);
      if (msg.ok && msg.text) return resolve(msg.text);
      reject(
        new UploadParseError(
          UploadParseErrorCode.ParserFailed,
          `${kind} parser failed: ${msg.error ?? "unknown"}`,
          "Could not parse this file safely. Please verify file integrity and retry."
        )
      );
    });

    worker.once("error", (error) => {
      clearTimeout(timer);
      reject(
        new UploadParseError(
          UploadParseErrorCode.ParserFailed,
          `${kind} sandbox worker crashed: ${error.message}`,
          "Parser crashed while processing this file. Please retry with a clean export."
        )
      );
    });

    worker.once("exit", (code) => {
      if (code !== 0) {
        clearTimeout(timer);
        reject(
          new UploadParseError(
            UploadParseErrorCode.ParserFailed,
            `${kind} sandbox worker exited with code ${code}`,
            "Parser process exited unexpectedly. Please retry with a different file."
          )
        );
      }
    });
  });
}
