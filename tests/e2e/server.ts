// A tiny static server for the E2E fixture pages in tests/e2e/fixtures/.
// Playwright starts it through `webServer`. Run with Node's type stripping.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { FIXTURE_HOST, FIXTURE_PORT } from './fixture-server.ts';

const root = resolve(import.meta.dirname, 'fixtures');
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

/**
 * Extra response headers per fixture page. `strict.html` runs under a strict
 * CSP (no inline style or script, same-origin CSS only). `blocked-clipboard.html`
 * denies `clipboard-write`, so the panel must show its fallback box.
 */
const pageHeaders: Record<string, Record<string, string>> = {
  '/strict.html': {
    'content-security-policy': "default-src 'none'; style-src 'self'",
  },
  '/blocked-clipboard.html': {
    'content-security-policy': "default-src 'none'; style-src 'self'",
    'permissions-policy': 'clipboard-write=()',
  },
};

createServer(async (request, response) => {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname;
  const file = normalize(join(root, path === '/' ? 'index.html' : path));
  if (!file.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, {
      'content-type': types[extname(file)] ?? 'application/octet-stream',
      ...pageHeaders[path],
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
}).listen(FIXTURE_PORT, FIXTURE_HOST, () => {
  console.log(`fixture server on http://${FIXTURE_HOST}:${FIXTURE_PORT}`);
});
