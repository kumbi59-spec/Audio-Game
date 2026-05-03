import { withParserBudget } from "./budget";

export async function parseDocx(buffer: Buffer): Promise<string> {
  return withParserBudget("docx", async () => {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({
      arrayBuffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
    });

    const text = result.value.trim();
    if (!text) {
      const errors = (result.messages ?? [])
        .filter((m: { type: string; message: string }) => m.type === "error")
        .map((m: { type: string; message: string }) => m.message)
        .join("; ");
      throw new Error(
        errors
          ? `Could not extract text from document: ${errors}`
          : "The document contains no readable text. Make sure it is a .docx file with actual text content (not just images)."
      );
    }

    return text;
  });
}
