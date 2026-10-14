/**
 * Minimal SPA static file server for Playwright e2e.
 * Uses only Node.js built-ins — no npm download required in CI.
 * Any path not found as a static file falls back to index.html.
 */
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, resolve, sep } from 'path';
import { fileURLToPath } from 'url';

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

/**
 * Maps a request URL to a path inside `root`, or null when it would
 * escape it. Browsers normalise `..` away, but a raw request
 * (`curl --path-as-is /../../etc/passwd`) keeps it.
 */
export function resolveRequestPath(root, url) {
  const base = resolve(root);
  const pathname = (url ?? '/').split('?')[0];
  const fp = resolve(base, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (fp !== base && !fp.startsWith(base + sep)) return null;
  return fp;
}

export function createSpaServer(root = ROOT) {
  const index = join(root, 'index.html');
  return createServer((req, res) => {
    let fp = resolveRequestPath(root, req.url);
    if (fp === null) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    // SPA fallback — unmatched paths serve index.html so the client-side
    // router (Expo Router) handles them.
    if (!existsSync(fp) || statSync(fp).isDirectory()) {
      fp = index;
    }

    const ct = MIME[extname(fp)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': ct });
    res.end(readFileSync(fp));
  });
}

// Imported by the unit test; only `node serve-spa.mjs` starts listening.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createSpaServer().listen(PORT, HOST, () => {
    // Playwright's webServer polls for this line on stdout to know the server is ready.
    process.stdout.write(`Serving web-build on http://${HOST}:${PORT}\n`);
  });
}
