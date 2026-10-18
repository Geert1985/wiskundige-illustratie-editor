'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const wieRoot = path.resolve(root, '../..');
  const wieFiles = new Set(['expression-numeric.js', 'expression-ast.js', 'expression-engine.js']);
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
    let file;
    if (pathname.startsWith('/_wie/')) {
      const name = pathname.slice('/_wie/'.length);
      if (!wieFiles.has(name)) { res.writeHead(403).end(); return; }
      file = path.join(wieRoot, name);
    } else {
      file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (file !== root && !file.startsWith(`${root}${path.sep}`)) { res.writeHead(403).end(); return; }
    }
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404).end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const pageErrors = [];
    const pageConsole = [];
    const responses = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') pageErrors.push(`${request.url()}: ${request.failure()?.errorText}`); });
    page.on('console', message => pageConsole.push(`${message.type()}: ${message.text()}`));
    page.on('response', response => responses.push([response.status(), new URL(response.url()).pathname]));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.locator('math-field').waitFor();
    try { await page.waitForFunction(() => customElements.get('math-field') !== undefined, { timeout: 5000 }); }
    catch { throw new Error(JSON.stringify({ phase: 'math-field-registration', pageErrors, pageConsole, responses, state: await page.evaluate(() => ({ readyState: document.readyState, appLoaded: [...document.scripts].map(s => s.src), defined: Boolean(customElements.get('math-field')), wieLoaded: Boolean(globalThis.FZI?.MathIllustration?.ExpressionEngine) })) })); }
    await page.waitForFunction(() => document.querySelector('#result-a')?.textContent !== 'Klaar voor berekening' && document.querySelector('#result-b')?.textContent !== 'Klaar voor berekening');
    assert.ok(Math.abs(Number((await page.locator('#result-a').textContent()).trim()) - 14) <= 1e-12);
    assert.ok(Math.abs(Number((await page.locator('#result-b').textContent()).trim().replace(',', '.')) - 14) <= 1e-12);
    const cases = [
      ['√81', 9, 9],
      ['sin(30 deg)', 0.5, 0.5],
      ['π × 2²', Math.PI * 4, Math.PI * 4],
    ];
    for (const [label, expectedA, expectedB] of cases) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.waitForFunction(() => document.querySelector('#result-a')?.textContent !== '…' && document.querySelector('#result-b')?.textContent !== '…');
      assert.ok(Math.abs(Number((await page.locator('#result-a').textContent()).trim()) - expectedA) <= 1e-12, `Variant A: ${label}`);
      const displayedB = (await page.locator('#result-b').textContent()).trim();
      assert.ok(Math.abs(Number(displayedB.replace('≈', '').replace(',', '.')) - expectedB) <= 1e-8, `Variant B: ${label}; displayed=${displayedB}; ASCIIMath=${await page.locator('#ascii-value').textContent()}; status=${await page.locator('#status-b').textContent()}`);
    }
    assert.deepEqual(pageErrors, []);
    process.stdout.write(JSON.stringify({ browser: `Edge ${browser.version()}`, examples: 4, variantA: 'PASS', variantB: 'PASS', pageErrors }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
