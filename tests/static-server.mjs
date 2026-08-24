import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);

const mimeTypes = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
});

function resolveRequestPath(pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  if (decodedPath.includes('\0')) return null;
  const relativePath = decodedPath.replace(/^\/+/, '') || 'index.html';
  const filePath = resolve(rootDir, relativePath);
  const relativePathToRoot = relative(rootDir, filePath);
  if (relativePathToRoot.startsWith('..') || isAbsolute(relativePathToRoot)) return null;
  return filePath;
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(body);
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, 'Method Not Allowed');
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
  } catch {
    sendText(response, 400, 'Bad Request');
    return;
  }

  if (pathname === '/__campushub_test_shutdown') {
    sendText(response, 200, 'CampusHub test server shutting down');
    setImmediate(shutdown);
    return;
  }

  const filePath = resolveRequestPath(pathname);
  if (!filePath) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const contentType = mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    if (request.method === 'HEAD') response.end();
    else response.end(file);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'EISDIR') {
      sendText(response, 404, 'Not Found');
      return;
    }
    sendText(response, 500, 'Internal Server Error');
  }
});

server.on('error', error => {
  console.error(error);
  process.exitCode = 1;
});

function shutdown() {
  server.closeAllConnections?.();
  server.close();
  process.exit(0);
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
process.once('SIGBREAK', shutdown);
if (!process.stdin.isTTY) {
  process.stdin.resume();
  process.stdin.once('end', shutdown);
  process.stdin.once('close', shutdown);
}

server.listen(port, '127.0.0.1', () => {
  console.log(`CampusHub static prototype server listening on http://127.0.0.1:${port}`);
});
