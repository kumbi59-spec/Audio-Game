const PDF_SIGNATURE = Buffer.from("%PDF-");
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export enum UploadParseErrorCode {
  MimeExtensionMismatch = "mime_extension_mismatch",
  InvalidPdfSignature = "invalid_pdf_signature",
  InvalidDocxSignature = "invalid_docx_signature",
  FileTooLarge = "file_too_large",
}

export class UploadParseError extends Error {
  readonly code: UploadParseErrorCode;
  readonly userMessage: string;

  constructor(code: UploadParseErrorCode, message: string, userMessage: string) {
    super(message);
    this.name = "UploadParseError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

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

export function hasPdfSignature(buffer: Buffer): boolean {
  return buffer.length >= PDF_SIGNATURE.length && buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE);
}

export function hasDocxSignature(buffer: Buffer): boolean {
  return buffer.length >= ZIP_SIGNATURE.length && buffer.subarray(0, ZIP_SIGNATURE.length).equals(ZIP_SIGNATURE);
}
