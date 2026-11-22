// Local static server for Cala Solara (Node 22 standard library only).
// Usage: node serve.ts [--port 8080]

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const cliArgs = process.argv.slice(2);
const portFlag = cliArgs.indexOf('--port');
const parsedPort = portFlag >= 0 ? Number(cliArgs[portFlag + 1]) : 8080;
const listenPort = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 8080;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const reqUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
  let reqPath: string;
  try {
    reqPath = decodeURIComponent(reqUrl.pathname);
  } catch {
    res.writeHead(400).end('Bad Request');
    return;
  }
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  const resolved = resolve(join(gameRoot, normalize(reqPath)));
  if (resolved !== gameRoot && !resolved.startsWith(gameRoot + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const info = statSync(resolved);
    if (!info.isFile()) throw new Error('Not a file');
    const mime = CONTENT_TYPES[extname(resolved).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, {
      'content-type': mime,
      'content-length': info.size,
      'cache-control': 'no-store',
    });
    createReadStream(resolved).pipe(res);
  } catch {
    res.writeHead(404).end('Not Found');
  }
});

server.listen(listenPort, '127.0.0.1', () => {
  console.log(`Cala Solara running at http://localhost:${listenPort}`);
});
