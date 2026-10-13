// The package's types only describe its entry point; the library file
// exports the same function. pdf.js also accepts a plain Uint8Array, which
// extract.ts passes on purpose.
declare module "pdf-parse/lib/pdf-parse.js" {
  import type PdfParse from "pdf-parse";
  export default function pdfParse(
    data: Buffer | Uint8Array,
    options?: PdfParse.Options,
  ): Promise<PdfParse.Result>;
}
