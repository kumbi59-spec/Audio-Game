export async function parseText(text: string, isMarkdown: boolean): Promise<string> {
  if (!isMarkdown) return text.trim();
  const { marked } = await import("marked");
  const html = await marked(text);
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}
