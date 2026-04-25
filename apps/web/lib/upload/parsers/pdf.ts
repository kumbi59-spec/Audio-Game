export async function parsePdf(buffer: Buffer): Promise<string> {
  // Dynamic import avoids issues with pdf-parse's filesystem test file loading
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text.trim();
}
