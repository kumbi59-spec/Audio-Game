import { withParserBudget } from "./budget";

export async function parsePdf(buffer: Buffer): Promise<string> {
  return withParserBudget("pdf", async () => {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js") as typeof import("pdf-parse");
    const data = await pdfParse(buffer);
    return data.text.trim();
  });
}
