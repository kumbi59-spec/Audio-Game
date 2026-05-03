export function isMimeExtensionCoherent(mimeType: string, filename: string): boolean {
  const ext = (filename.split('.').pop() ?? '').toLowerCase();
  if (!ext) return false;
  const map: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'application/json': ['json'],
    'text/markdown': ['md', 'markdown'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/msword': ['doc'],
    'text/plain': ['txt', 'md', 'markdown'],
  };
  const allowed = map[mimeType];
  return Array.isArray(allowed) ? allowed.includes(ext) : true;
}
