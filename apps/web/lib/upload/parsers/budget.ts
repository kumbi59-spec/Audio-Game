import { PARSER_MEMORY_BUDGET_BYTES, PARSER_TIME_BUDGET_MS } from "../constants";
import { UploadParseError, UploadParseErrorCode } from "../guards";

export async function withParserBudget<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const startMemory = process.memoryUsage().heapUsed;
  let timeoutHandle: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new UploadParseError(
          UploadParseErrorCode.ParserTimeout,
          `${label} parser exceeded ${PARSER_TIME_BUDGET_MS}ms`,
          "File parsing timed out. Please simplify the document and retry."
        )
      );
    }, PARSER_TIME_BUDGET_MS);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    if (timeoutHandle) clearTimeout(timeoutHandle);
    const used = process.memoryUsage().heapUsed - startMemory;
    if (used > PARSER_MEMORY_BUDGET_BYTES) {
      throw new UploadParseError(
        UploadParseErrorCode.ParserMemoryLimit,
        `${label} parser exceeded memory budget with ${used} bytes`,
        "File parsing used too much memory. Please upload a smaller/simpler file."
      );
    }
    return result;
  } catch (error) {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    if (error instanceof UploadParseError) throw error;
    throw new UploadParseError(
      UploadParseErrorCode.ParserFailed,
      `${label} parser failed: ${error instanceof Error ? error.message : String(error)}`,
      "Could not parse this file. Please check format integrity and try again."
    );
  }
}
