import { Buffer } from "node:buffer";

/**
 * MIME-aware extraction of a Game Bible source file into plain text.
 * Runs before the LLM ingestion pass so the downstream pipeline never sees
 * binary. PDF uses pdf-parse (no OCR — scanned PDFs fall through to a
 * helpful error until Tesseract is wired in Phase 4). DOCX uses mammoth.
 * Plain text and Markdown pass through unchanged.
 */

export interface ExtractInput {
  buffer: Buffer;
  mimeType?: string;
  filename?: string;
}

export interface ExtractResult {
  text: string;
  format: "pdf" | "docx" | "markdown" | "text" | "json";
  meta: {
    pages?: number;
    bytesIn: number;
  };
}

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB hard ceiling before paid tiers.

export async function extractBibleText(input: ExtractInput): Promise<ExtractResult> {
  if (input.buffer.length === 0) {
    throw new Error("Empty file.");
  }
  if (input.buffer.length > MAX_BYTES) {
    throw new Error(
      `File is too large (${Math.round(input.buffer.length / 1024 / 1024)} MB). Max ${MAX_BYTES / 1024 / 1024} MB.`,
    );
  }

  const format = classify(input);
  switch (format) {
    case "pdf":
      return extractPdf(input.buffer);
    case "docx":
      return extractDocx(input.buffer);
    case "json":
    case "markdown":
    case "text":
      return {
        text: input.buffer.toString("utf8"),
        format,
        meta: { bytesIn: input.buffer.length },
      };
  }
}

function classify(input: ExtractInput): ExtractResult["format"] {
  const mt = (input.mimeType ?? "").toLowerCase();
  const fn = (input.filename ?? "").toLowerCase();

  if (mt.includes("pdf") || fn.endsWith(".pdf")) return "pdf";
  if (
    mt.includes("officedocument.wordprocessingml") ||
    fn.endsWith(".docx")
  )
    return "docx";
  if (mt.includes("json") || fn.endsWith(".json")) return "json";
  if (mt.includes("markdown") || fn.endsWith(".md") || fn.endsWith(".markdown"))
    return "markdown";

  // Sniff: if first 4 bytes match %PDF, treat as PDF.
  if (
    input.buffer.length >= 4 &&
    input.buffer[0] === 0x25 &&
    input.buffer[1] === 0x50 &&
    input.buffer[2] === 0x44 &&
    input.buffer[3] === 0x46
  ) {
    return "pdf";
  }
  // DOCX is a zip; magic starts with PK (0x50 0x4b).
  if (
    input.buffer.length >= 2 &&
    input.buffer[0] === 0x50 &&
    input.buffer[1] === 0x4b
  ) {
    return "docx";
  }
  return "text";
}

async function extractPdf(buf: Buffer): Promise<ExtractResult> {
  // pdf-parse ships with a CJS default export; dynamic import avoids its
  // debug-only top-level side effect on module load.
  const { default: pdfParse } = (await import("pdf-parse")) as {
    default: (b: Buffer) => Promise<{ text: string; numpages: number }>;
  };
  const result = await pdfParse(buf);
  const text = result.text.trim();
  if (!text) {
    throw new Error(
      "No extractable text. If this is a scanned PDF, OCR is not yet supported — please paste the text or upload a DOCX.",
    );
  }
  return {
    text,
    format: "pdf",
    meta: { pages: result.numpages, bytesIn: buf.length },
  };
}

async function extractDocx(buf: Buffer): Promise<ExtractResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: buf });
  const text = result.value.trim();
  if (!text) {
    throw new Error("The DOCX contained no text.");
  }
  return {
    text,
    format: "docx",
    meta: { bytesIn: buf.length },
  };
}
