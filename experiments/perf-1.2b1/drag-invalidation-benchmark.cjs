// Limited Edge comparison for PERF-1.2b1. "before" forces the former full
// invalidation route for every drag move; "after" uses the drag route.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const fixture = require('../perf-1.1/fixtures.cjs');
const root = path.resolve(__dirname, '../..');
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end();
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(data);
  });
});
const stat = values => {
  const sorted = values.slice().sort((a, b) => a - b);
  return { samples: values.length, medianMs: +sorted[Math.floor(sorted.length / 2)].toFixed(3), maxMs: +sorted.at(-1).toFixed(3) };
};

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(60000);
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/editor.html`);
    const results = [];
    for (const count of [10, 100, 500]) {
      const data = fixture(count);
      const measurements = await page.evaluate(async data => {
        const app = FZI.MathIllustration.editor, times = { render: 0, canvas: 0, list: 0, inspector: 0, event: 0 }, counts = { render: 0, canvas: 0, list: 0, inspector: 0 };
        let mode = 'before';
        const wrap = (owner, key, timeKey) => {
          const original = owner[key];
          owner[key] = function (...args) { const start = performance.now(); try { return original.apply(this, args); } finally { times[timeKey] += performance.now() - start; counts[timeKey]++; } };
        };
        app.loadDocument(data);
        await new Promise(requestAnimationFrame);
        wrap(app, 'render', 'render'); wrap(app, 'renderCanvas', 'canvas'); wrap(app, 'renderViewList', 'list'); wrap(app, 'renderInspector', 'inspector');
        const invalidate = app.invalidate.bind(app);
        app.invalidate = (reason, defer) => invalidate(mode === 'before' && reason === 'drag' ? 'full' : reason, defer);
        const sources = new Set(data.objects.flatMap(o => o.construction?.sources?.map(s => s.objectId) || []));
        const targets = [
          { kind: 'ordinary', object: [...data.objects].reverse().find(o => o.type === 'point' && !o.construction && !sources.has(o.id)) },
          { kind: 'with-dependents', object: data.objects.find(o => o.type === 'point' && !o.construction && sources.has(o.id)) }
        ].filter(entry => entry.object);
        const rows = [];
        for (mode of ['before', 'after']) for (const scenario of targets) {
          const targetId = scenario.object.id, original = structuredClone(app.engine.get(targetId)), startScreen = app.transform().mathToScreen(original), moveCount = data.objects.length >= 500 ? 1 : 5;
          app.selectedId = targetId;
          app.interaction = { mode: 'object', id: targetId, original, pointerId: 1, startScreen, transform: app.transform(), selectionBefore: targetId, selectionIdsBefore: [targetId] };
          for (const key of Object.keys(times)) times[key] = 0;
          for (const key of Object.keys(counts)) counts[key] = 0;
          const samples = [];
          for (let i = 0; i < moveCount; i++) {
            const point = app.transform().mathToScreen({ x: original.x + .37 + i * .015, y: original.y + .43 + i * .012 });
            const began = performance.now(); app.pointerMove({ pointerId: 1, clientX: point.x, clientY: point.y, target: app.nodes.canvasWrap }); times.event += performance.now() - began;
            await new Promise(requestAnimationFrame); samples.push(performance.now() - began);
          }
          rows.push({ mode, scenario: scenario.kind, pointId: targetId, moveCount, interactionWallMs: +samples.reduce((a, b) => a + b, 0).toFixed(3), totalProcessingMs: +(times.event + times.render).toFixed(3), renderMs: +times.render.toFixed(3), counts: { ...counts }, partMs: { canvas: +times.canvas.toFixed(3), list: +times.list.toFixed(3), inspector: +times.inspector.toFixed(3) } });
          app.interaction = null; app.feedback = null; app.engine.renderer.preview = null; app.engine.update(targetId, original);
        }
        return rows;
      }, data);
      for (const row of measurements) { results.push({ objects: count, ...row }); console.log(JSON.stringify({ objects: count, ...row })); }
    }
    const output = { browser: await page.evaluate(() => navigator.userAgent), viewport: { width: 1280, height: 900 }, fixtures: 'PERF-1.1 mixed; source point has an existing downstream construction for with-dependents', repetitions: '5 moves for 10/100 objects; 1 move for 500 objects because each full list render is expensive', before: 'same code with drag invalidation forced to full, matching the previous pointerMove route', results };
    fs.writeFileSync(path.join(__dirname, 'drag-invalidation-results.json'), JSON.stringify(output, null, 2));
    console.log(JSON.stringify({ saved: path.join(__dirname, 'drag-invalidation-results.json'), results }, null, 2));
  } finally { await browser?.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
