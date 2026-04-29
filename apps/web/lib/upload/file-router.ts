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

  if (mimeType === PDF_MIME || PDF_EXTS.has(fileExt)) {
    const { parsePdf } = await import("./parsers/pdf");
    return parsePdf(buffer);
  }

  if (mimeType === DOCX_MIME || mimeType === DOC_MIME || DOCX_EXTS.has(fileExt)) {
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

