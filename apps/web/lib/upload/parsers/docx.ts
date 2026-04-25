export async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  // mammoth accepts { arrayBuffer } as well; cast to avoid TS Buffer/ArrayBuffer mismatch
  const result = await mammoth.extractRawText({
    arrayBuffer: buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer,
  });
  return result.value.trim();
}
