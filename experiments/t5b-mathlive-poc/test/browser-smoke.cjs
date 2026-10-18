'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const wieRoot = path.resolve(root, '../..');
  const screenshots = path.join(root, 'artifacts');
  fs.mkdirSync(screenshots, { recursive: true });
  const wieFiles = new Set(['expression-numeric.js', 'expression-ast.js', 'expression-engine.js']);
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2' };
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
  let browserLabel = 'Edge';
  try {
    try { browser = await chromium.launch({ channel: 'msedge', headless: true }); }
    catch { browserLabel = 'Playwright Chromium fallback (Edge kon niet starten)'; browser = await chromium.launch({ headless: true }); }
    const page = await browser.newPage({ viewport: { width: 1365, height: 1000 }, deviceScaleFactor: 1 });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') pageErrors.push(`${request.url()}: ${request.failure()?.errorText}`); });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const field = page.locator('#formula');
    await field.waitFor();
    await page.waitForFunction(() => customElements.get('math-field') !== undefined && document.querySelector('#result-b')?.textContent !== 'Klaar voor berekening');

    const nativeVisible = () => page.evaluate(() => window.mathVirtualKeyboard.visible);
    await page.getByRole('button', { name: 'Toetsenbord openen' }).click();
    assert.equal(await nativeVisible(), true, 'standard MathLive virtual keyboard opens');
    await page.getByRole('button', { name: 'Toetsenbord sluiten' }).click();
    assert.equal(await nativeVisible(), false, 'standard MathLive virtual keyboard closes');
    await page.getByRole('button', { name: 'Toetsenbord openen' }).click();
    await page.screenshot({ path: path.join(screenshots, 'keyboard-standard.png') });
    const initialFormula = await field.evaluate(element => element.getValue('latex-expanded'));
    await page.getByLabel('WIE-toetsenbord').check();
    assert.equal(await field.evaluate(element => element.getValue('latex-expanded')), initialFormula, 'formula remains intact when switching');
    assert.equal(await nativeVisible(), false, 'native MathLive keyboard is hidden in WIE mode');
    await page.locator('#custom-keyboard').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#keyboard-toggle').getAttribute('aria-expanded'), 'true');
    await page.getByRole('button', { name: 'Toetsenbord sluiten' }).click();
    assert.equal(await page.locator('#custom-keyboard').isVisible(), false, 'WIE keyboard closes');
    assert.equal(await nativeVisible(), false, 'closing WIE keyboard does not open MathLive keyboard');
    await page.getByRole('button', { name: 'Toetsenbord openen' }).click();
    assert.equal(await page.locator('#custom-keyboard').isVisible(), true, 'WIE keyboard opens again');
    await page.screenshot({ path: path.join(screenshots, 'keyboard-wie.png') });

    await field.evaluate(element => element.setValue(''));
    for (const key of ['digit-2', 'plus', 'digit-3', 'multiply', 'digit-4']) await page.locator(`[data-key="${key}"]`).click();
    await page.waitForFunction(() => document.querySelector('#result-b')?.textContent.trim() === '14');
    assert.equal(await field.evaluate(element => element.getValue('ascii-math').replace(/\s+/g, '')), '2+3*4');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'formula', 'focus returns to the shared Mathfield after key input');

    await field.evaluate(element => element.executeCommand('selectAll'));
    await page.locator('[data-key="digit-7"]').click();
    assert.equal((await field.evaluate(element => element.getValue('ascii-math'))).trim(), '7', 'button input replaces the active selection');

    await field.evaluate(element => element.setValue(''));
    await page.locator('[data-key="fraction"]').click();
    assert.match(await field.evaluate(element => element.getValue('latex-expanded')), /\\frac/);
    await page.locator('[data-key="digit-1"]').click();
    await page.locator('[data-key="down"]').click();
    await page.locator('[data-key="digit-2"]').click();
    assert.match(await field.evaluate(element => element.getValue('latex-expanded')), /\\frac\{1\}\{2\}/, 'fraction placeholders accept numerator and denominator');

    await field.evaluate(element => element.setValue(''));
    await page.locator('[data-key="power"]').click();
    await page.locator('[data-key="digit-3"]').click();
    assert.match(await field.evaluate(element => element.getValue('latex-expanded')), /\^\{3\}/, 'power template places the caret in its exponent');
    await page.locator('[data-key="left"]').click();
    await page.locator('[data-key="right"]').click();
    assert.match(await field.evaluate(element => element.getValue('latex-expanded')), /\^\{3\}/, 'cursor moves inside a power without changing its structure');

    await field.evaluate(element => element.setValue(''));
    await page.locator('[data-key="sqrt"]').click();
    await page.locator('[data-key="digit-9"]').click();
    assert.match(await field.evaluate(element => element.getValue('latex-expanded')), /\\sqrt\{9\}/, 'root template places the caret in its radicand');
    await page.locator('[data-key="up"]').click();
    await page.locator('[data-key="down"]').click();
    assert.match(await field.evaluate(element => element.getValue('latex-expanded')), /\\sqrt\{9\}/, 'cursor navigates through a root without changing its structure');
    await page.waitForFunction(() => document.querySelector('#result-b')?.textContent.trim() === '3');

    await field.evaluate(element => element.setValue('123'));
    await page.locator('[data-key="left"]').click();
    await page.locator('[data-key="backspace"]').click();
    assert.equal((await field.evaluate(element => element.getValue('ascii-math'))).trim(), '13', 'left and Backspace edit at the caret');

    const shift = page.locator('[data-key="shift"]');
    await shift.click();
    assert.equal(await shift.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-key="sin"]').textContent(), 'asin');
    await page.locator('[data-key="sin"]').click();
    assert.equal(await shift.getAttribute('aria-pressed'), 'false', 'SHIFT resets after one secondary action');
    assert.match(await field.evaluate(element => element.getValue('latex-expanded')), /arcsin/);

    await field.evaluate(element => element.setValue('1/3'));
    await page.waitForFunction(() => document.querySelector('#result-b')?.textContent.trim() === '≈0,33333333');
    const retainedFormula = await field.evaluate(element => element.getValue('latex-expanded'));
    await page.getByLabel('Standaard MathLive').check();
    assert.equal(await field.evaluate(element => element.getValue('latex-expanded')), retainedFormula, 'formula remains intact switching back');
    assert.equal(await nativeVisible(), true, 'standard keyboard reopens for the same session');
    assert.equal(await page.locator('#custom-keyboard').isVisible(), false, 'custom and native keyboards are never shown together');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('WIE-toetsenbord').check();
    assert.equal(await page.locator('#custom-keyboard').isVisible(), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'small viewport has no horizontal page overflow');
    await page.screenshot({ path: path.join(screenshots, 'keyboard-wie-mobile.png'), fullPage: true });
    assert.deepEqual(pageErrors, []);
    process.stdout.write(JSON.stringify({ browser: browserLabel, checks: 8, standardKeyboard: 'PASS', wieKeyboard: 'PASS', calculator: 'PASS', screenshots: ['artifacts/keyboard-standard.png', 'artifacts/keyboard-wie.png', 'artifacts/keyboard-wie-mobile.png'], pageErrors }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
