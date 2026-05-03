import {
  hasDocxSignature,
  hasPdfSignature,
  isMimeExtensionCoherent,
  looksLikeJson,
  UploadParseError,
  UploadParseErrorCode,
} from "./guards";
import { ACCEPTED_MIME_TYPES, MAX_FILE_BYTES, MAX_TEXT_CHARS, MAX_TEXT_TOKENS_ESTIMATE } from "./constants";
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
  if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
    throw new UploadParseError(
      UploadParseErrorCode.UnsupportedMimeType,
      `Unsupported MIME type: ${mimeType}`,
      "Unsupported file type. Please upload PDF, DOCX, TXT, Markdown, or JSON."
    );
  }

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
    return enforceTextBudget(await parsePdf(buffer));
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
    return enforceTextBudget(await parseDocx(buffer));
  }

  const text = buffer.toString("utf-8");

  if (mimeType === JSON_MIME || JSON_EXTS.has(fileExt)) {
    if (!looksLikeJson(buffer)) {
      throw new UploadParseError(
        UploadParseErrorCode.ContentSniffMismatch,
        "JSON upload content does not look like JSON",
        "The file extension says JSON, but the content does not appear to be valid JSON."
      );
    }
    const { parseJsonBible } = await import("./parsers/json");
    return enforceTextBudget(await parseJsonBible(text));
  }

  const isMarkdown =
    mimeType === "text/markdown" || MARKDOWN_EXTS.has(fileExt);
  const { parseText } = await import("./parsers/text");
  return enforceTextBudget(await parseText(text, isMarkdown));
}

function enforceTextBudget(text: string): string {
  if (text.length > MAX_TEXT_CHARS) {
    throw new UploadParseError(
      UploadParseErrorCode.TextTooLarge,
      `Extracted text too large: ${text.length} chars`,
      "Uploaded content is too large after extraction. Please upload a smaller document."
    );
  }
  const estimatedTokens = Math.ceil(text.length / 4);
  if (estimatedTokens > MAX_TEXT_TOKENS_ESTIMATE) {
    throw new UploadParseError(
      UploadParseErrorCode.TokenEstimateTooLarge,
      `Extracted token estimate too large: ${estimatedTokens}`,
      "Uploaded content is too large for processing. Please split the document and try again."
    );
  }
  return text;
}
