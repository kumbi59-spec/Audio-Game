import { runParserInSandbox } from "./sandbox";

export async function parseDocx(buffer: Buffer): Promise<string> {
  return runParserInSandbox("docx", buffer);
}
