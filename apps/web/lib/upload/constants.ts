export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "application/json",
];

export const ACCEPTED_EXTENSIONS = ".pdf,.docx,.doc,.txt,.md,.markdown,.json";
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_CHARS = 800_000;
export const MAX_TEXT_TOKENS_ESTIMATE = 200_000;
export const PARSER_TIME_BUDGET_MS = 7_500;
export const PARSER_MEMORY_BUDGET_BYTES = 256 * 1024 * 1024;
