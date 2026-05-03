function normalizePdfBuffer(buffer: Buffer): Buffer {
  const header = "%PDF-";
  const searchWindow = Math.min(buffer.length, 1024);
  const signatureOffset = buffer.subarray(0, searchWindow).indexOf(header);

  if (signatureOffset === -1) {
    throw new Error("invalid_pdf_signature");
  }

  return signatureOffset === 0 ? buffer : buffer.subarray(signatureOffset);
}

export async function parsePdf(buffer: Buffer): Promise<string> {
  const normalized = normalizePdfBuffer(buffer);
  // Import from the inner lib directly: pdf-parse's index.js checks !module.parent,
  // which is undefined in some Node/bundler contexts, triggering debug-mode and a
  // filesystem read of a test PDF that doesn't exist at runtime.
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as typeof import("pdf-parse");
  const data = await pdfParse(normalized);
  return data.text.trim();
}
