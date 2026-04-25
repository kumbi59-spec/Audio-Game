/**
 * Minimal SPA static file server for Playwright e2e.
 * Uses only Node.js built-ins — no npm download required in CI.
 * Any path not found as a static file falls back to index.html.
 */
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '127.0.0.1';
const ROOT = new URL('./web-build', import.meta.url).pathname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const INDEX = join(ROOT, 'index.html');

createServer((req, res) => {
  const url = (req.url ?? '/').split('?')[0];
  let fp = join(ROOT, url === '/' ? 'index.html' : url);

  // SPA fallback — unmatched paths serve index.html so the client-side
  // router (Expo Router) handles them.
  if (!existsSync(fp) || statSync(fp).isDirectory()) {
    fp = INDEX;
  }

  const ct = MIME[extname(fp)] ?? 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': ct });
  res.end(readFileSync(fp));
}).listen(PORT, HOST, () => {
  // Playwright's webServer polls for this line on stdout to know the server is ready.
  process.stdout.write(`Serving web-build on http://${HOST}:${PORT}\n`);
});
