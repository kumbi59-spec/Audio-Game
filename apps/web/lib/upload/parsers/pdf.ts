export async function parsePdf(buffer: Buffer): Promise<string> {
  // Import from the inner lib directly: pdf-parse's index.js checks !module.parent,
  // which is undefined in some Node/bundler contexts, triggering debug-mode and a
  // filesystem read of a test PDF that doesn't exist at runtime.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as typeof import("pdf-parse");
  const data = await pdfParse(buffer);
  return data.text.trim();
}
