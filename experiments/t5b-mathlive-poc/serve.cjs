'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname);
const wieRoot = path.resolve(__dirname, '../..');
const wieFiles = new Set(['expression-numeric.js', 'expression-ast.js', 'expression-engine.js']);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  let target;
  if (pathname.startsWith('/_wie/')) {
    const filename = pathname.slice('/_wie/'.length);
    if (!wieFiles.has(filename)) { res.writeHead(403).end(); return; }
    target = path.join(wieRoot, filename);
  } else {
    target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
  }
  fs.stat(target, (statError, stat) => {
    if (statError || !stat.isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
    fs.createReadStream(target).pipe(res);
  });
});
const port = Number(process.env.PORT) || 4178;
server.listen(port, '127.0.0.1', () => process.stdout.write(`T5b MathLive POC: http://127.0.0.1:${port}\n`));
