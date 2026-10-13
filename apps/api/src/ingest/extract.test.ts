import { describe, expect, it } from "vitest";
import { extractBibleText } from "./extract.js";

/** A one-page PDF with a single line of Helvetica text. */
function minimalPdf(text: string): Buffer {
  const content = `BT /F1 24 Tf 72 700 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefAt = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

describe("extractBibleText", () => {
  it("extracts text from a PDF", async () => {
    const result = await extractBibleText({
      buffer: minimalPdf("The Sunken Bell rings at dusk"),
      filename: "bible.pdf",
    });
    expect(result.format).toBe("pdf");
    expect(result.text).toContain("The Sunken Bell rings at dusk");
    expect(result.meta.pages).toBe(1);
  });

  it("passes plain text through", async () => {
    const result = await extractBibleText({
      buffer: Buffer.from("A fogbound fishing village."),
      filename: "notes.txt",
    });
    expect(result).toMatchObject({ format: "text", text: "A fogbound fishing village." });
  });
});
