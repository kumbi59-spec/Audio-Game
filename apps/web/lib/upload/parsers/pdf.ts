import { runParserInSandbox } from "./sandbox";

export async function parsePdf(buffer: Buffer): Promise<string> {
  return runParserInSandbox("pdf", buffer);
}
