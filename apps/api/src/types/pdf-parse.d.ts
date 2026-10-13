// The package's types only describe its entry point; the library file
// exports the same function.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export default pdfParse;
}
