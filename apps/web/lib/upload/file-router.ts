import {
  hasDocxSignature,
  hasPdfSignature,
  isMimeExtensionCoherent,
  UploadParseError,
  UploadParseErrorCode,
} from "./guards";
import { MAX_FILE_BYTES } from "./constants";
export { ACCEPTED_MIME_TYPES, ACCEPTED_EXTENSIONS, MAX_FILE_BYTES } from "./constants";

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";
const JSON_MIME = "application/json";

const MARKDOWN_EXTS = new Set(["md", "markdown"]);
const PDF_EXTS = new Set(["pdf"]);
const DOCX_EXTS = new Set(["docx", "doc"]);
const JSON_EXTS = new Set(["json"]);

function ext(filename: string): string {
  return (filename.split(".").pop() ?? "").toLowerCase();
}

/** Route an uploaded file to the correct parser and return plain text. */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const fileExt = ext(filename);

  if (buffer.length > MAX_FILE_BYTES) {
    throw new UploadParseError(
      UploadParseErrorCode.FileTooLarge,
      `File is too large: ${buffer.length} bytes`,
      "File is too large. Maximum upload size is 10 MB."
    );
  }

  // First pass: ensure MIME and extension coherence.
  if (!isMimeExtensionCoherent(mimeType, filename)) {
    throw new UploadParseError(
      UploadParseErrorCode.MimeExtensionMismatch,
      "Uploaded file type does not match filename extension",
      "File type does not match its extension. Please upload a valid PDF, DOCX, TXT, Markdown, or JSON file."
    );
  }

  if (mimeType === PDF_MIME || PDF_EXTS.has(fileExt)) {
    if (!hasPdfSignature(buffer)) {
      throw new UploadParseError(
        UploadParseErrorCode.InvalidPdfSignature,
        "Invalid PDF signature",
        "This file is not a valid PDF. Please re-export or re-save it as a PDF and try again."
      );
    }

    const { parsePdf } = await import("./parsers/pdf");
    return parsePdf(buffer);
  }

  if (mimeType === DOCX_MIME || mimeType === DOC_MIME || DOCX_EXTS.has(fileExt)) {
    if (!hasDocxSignature(buffer)) {
      throw new UploadParseError(
        UploadParseErrorCode.InvalidDocxSignature,
        "Invalid DOCX signature",
        "This document is not a valid DOCX file. Please re-save it as .docx and try again."
      );
    }

    const { parseDocx } = await import("./parsers/docx");
    return parseDocx(buffer);
  }

  const text = buffer.toString("utf-8");

  if (mimeType === JSON_MIME || JSON_EXTS.has(fileExt)) {
    const { parseJsonBible } = await import("./parsers/json");
    return parseJsonBible(text);
  }

  const isMarkdown =
    mimeType === "text/markdown" || MARKDOWN_EXTS.has(fileExt);
  const { parseText } = await import("./parsers/text");
  return parseText(text, isMarkdown);
}
