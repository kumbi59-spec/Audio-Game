const { parentPort, workerData } = require('node:worker_threads');

(async () => {
  const { kind, base64 } = workerData;
  const buffer = Buffer.from(base64, 'base64');
  try {
    if (kind === 'pdf') {
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      // Pass a plain Uint8Array, not the Buffer: pdf.js copies its input with
      // the input's own constructor, and for a Buffer that copy can land in
      // Node's shared pool, which pdf.js then reads from offset 0, parsing
      // whatever else shares the slab ("bad XRef entry" on small PDFs).
      const data = await pdfParse(new Uint8Array(buffer));
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
