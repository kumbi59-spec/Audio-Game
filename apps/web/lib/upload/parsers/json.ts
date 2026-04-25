/**
 * If the uploaded file is already a JSON Game Bible (structured object),
 * convert it to a readable text representation for Claude extraction.
 * If it looks like raw text inside a JSON string, return it directly.
 */
export function parseJsonBible(raw: string): string {
  try {
    const data = JSON.parse(raw);
    if (typeof data === "string") return data;
    return JSON.stringify(data, null, 2);
  } catch {
    return raw;
  }
}
