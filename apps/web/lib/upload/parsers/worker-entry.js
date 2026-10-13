const { parentPort, workerData } = require('node:worker_threads');

(async () => {
  const { kind, base64 } = workerData;
  const buffer = Buffer.from(base64, 'base64');
  try {
    if (kind === 'pdf') {
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParse(buffer);
      parentPort.postMessage({ ok: true, text: (data.text || '').trim() });
      return;
    }
    if (kind === 'docx') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({
        arrayBuffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      });
      // Empty text is not a parser failure; the upload route turns it into
      // "no readable text" rather than quarantining the file.
      parentPort.postMessage({ ok: true, text: (result.value || '').trim() });
      return;
    }
    throw new Error(`Unsupported parser kind: ${kind}`);
  } catch (error) {
    parentPort.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
})();
