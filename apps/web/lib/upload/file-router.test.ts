import { describe, expect, it } from "vitest";
import { extractText, MAX_FILE_BYTES } from "./file-router";
import { UploadParseError, UploadParseErrorCode } from "./guards";

describe("extractText guards", () => {
  it("rejects mismatched MIME type and extension before parsing", async () => {
    const run = extractText(Buffer.from("hello"), "application/pdf", "notes.txt");

    await expect(run).rejects.toMatchObject({
      code: UploadParseErrorCode.MimeExtensionMismatch,
    });
  });

  it("rejects invalid PDF signature", async () => {
    const run = extractText(Buffer.from("not-a-pdf"), "application/pdf", "guide.pdf");

    await expect(run).rejects.toMatchObject({
      code: UploadParseErrorCode.InvalidPdfSignature,
    });
  });

  it("rejects invalid DOCX signature", async () => {
    const run = extractText(
      Buffer.from("not-a-docx"),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "guide.docx"
    );

    await expect(run).rejects.toMatchObject({
      code: UploadParseErrorCode.InvalidDocxSignature,
    });
  });

  it("enforces size limits before decoding large text buffers", async () => {
    const oversized = Buffer.alloc(MAX_FILE_BYTES + 1, 0x61);

    await expect(extractText(oversized, "text/plain", "huge.txt")).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof UploadParseError && err.code === UploadParseErrorCode.FileTooLarge
    );
  });

  it("rejects zip-bomb style oversized payloads immediately", async () => {
    const oversizedZipLike = Buffer.alloc(MAX_FILE_BYTES + 1, 0);
    oversizedZipLike[0] = 0x50;
    oversizedZipLike[1] = 0x4b;
    oversizedZipLike[2] = 0x03;
    oversizedZipLike[3] = 0x04;

    await expect(
      extractText(
        oversizedZipLike,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "bomb.docx"
      )
    ).rejects.toMatchObject({ code: UploadParseErrorCode.FileTooLarge });
  });

  it("rejects malformed json that fails content sniffing", async () => {
    await expect(extractText(Buffer.from("<xml>oops</xml>"), "application/json", "world.json")).rejects.toMatchObject({
      code: UploadParseErrorCode.ContentSniffMismatch,
    });
  });
});
