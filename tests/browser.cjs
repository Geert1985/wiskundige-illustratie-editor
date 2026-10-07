// Optional real-browser smoke test: requires playwright and an installed Edge.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/editor.html`);
    const before = await page.evaluate(() => FZI.MathIllustration.activeEngine.renderer.scale());
    const rect = await page.locator('#canvasWrap').boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.wheel(0, -100);
    await page.waitForFunction(value => FZI.MathIllustration.activeEngine.renderer.scale() > value, before);
    const result = await page.evaluate(() => {
      const e = FZI.MathIllustration.activeEngine, wrap = document.getElementById('canvasWrap'), rect = wrap.getBoundingClientRect();
      const wheel = deltaY => wrap.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
      for (let i = 0; i < 30; i++) wheel(-100);
      const maxScale = e.renderer.scale(), step = e.renderer.axisStep, bounds = JSON.stringify(e.renderer.bounds);
      wheel(-100); const blocked = bounds === JSON.stringify(e.renderer.bounds);
      wheel(100); const outScale = e.renderer.scale();
      e.renderer.showGrid = true;
      for (let i = 0; i < 250; i++) wheel(100);
      const svg = e.renderSVG();
      return { maxScale, step, blocked, outScale, finite: !/NaN|Infinity/.test(svg), lines: (svg.match(/<line /g) || []).length };
    });
    assert.ok(Math.abs(result.maxScale - 700) < 1e-8); assert.equal(result.step, .1);
    assert.ok(result.blocked); assert.ok(result.outScale < 700); assert.ok(result.finite); assert.ok(result.lines < 1000);
    // Reset and verify ordinary authoring still works with all feature scripts loaded.
    await page.locator('#resetViewBtn').click();
    await page.locator('[data-tool="point"]').click();
    await page.locator('#canvasWrap').click({ position: { x: 200, y: 200 } });
    assert.equal(await page.evaluate(() => FZI.MathIllustration.activeEngine.model.objects.length), 1);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ browser: 'Edge', ...result, pointCreation: 'passed', pageErrors: errors }));
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
