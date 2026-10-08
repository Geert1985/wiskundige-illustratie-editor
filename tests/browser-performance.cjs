const assert = require('node:assert/strict');
const fixture = require('./fixtures/performance.cjs');
module.exports = async function benchmarkBrowser(page, verify = false) {
  const rows = [];
  for (const count of [10, 100, 500]) {
    rows.push(await page.evaluate(async data => {
      const MI = FZI.MathIllustration, app = MI.editor;
      app.loadDocument(data); app.setTool('line');
      const transform = MI.CoordinateTransform.forCanvas(app.engine);
      const sample = () => MI.SnapService.resolve(app.engine, { x: .23, y: .31 }, { transform });
      let start = performance.now(); sample(); const coldMs = performance.now() - start;
      const samples = []; for (let i = 0; i < 15; i++) { start = performance.now(); sample(); samples.push(performance.now() - start); }
      samples.sort((a, b) => a - b);
      let renders = 0; const original = app.render;
      app.render = function() { renders++; return original.call(this); };
      const wrap = document.getElementById('canvasWrap'), startPoint = transform.mathToScreen({ x: -4, y: -2 });
      wrap.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 101, isPrimary: true, button: 0, clientX: startPoint.x, clientY: startPoint.y, bubbles: true }));
      renders = 0; start = performance.now();
      for (let i = 0; i < 20; i++) {
        const point = transform.mathToScreen({ x: .23 + i * .005, y: .31 + i * .003 });
        window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 101, clientX: point.x, clientY: point.y }));
      }
      const streamWorkMs = performance.now() - start, preview = app.engine.renderer.preview;
      await new Promise(requestAnimationFrame); const rendersPerBurst = renders;
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 101 }));
      const saved = app.engine.model.objects.at(-1);
      app.render = original;
      return { count: data.objects.length, coldMs, warmMedianMs: samples[7], streamWorkMs, rendersPerBurst, preview, saved };
    }, fixture(count)));
    const row = rows.at(-1);
    assert.equal(row.saved.x2, row.preview.end.x); assert.equal(row.saved.y2, row.preview.end.y);
    if (verify) assert.equal(row.rendersPerBurst, 1);
    if (verify) await page.evaluate(async () => {
      const app = FZI.MathIllustration.editor, wrap = document.getElementById('canvasWrap'), transform = app.transform();
      const down = transform.mathToScreen({ x: -4, y: -2 }), end = transform.mathToScreen({ x: 1.31, y: .57 });
      const begin = () => {
        wrap.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 101, isPrimary: true, button: 0, clientX: down.x, clientY: down.y }));
        window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 101, clientX: end.x, clientY: end.y }));
        if (app.renderFrame === null) throw new Error('Expected pending frame');
      };
      begin(); app.keyDown({ key: '1', preventDefault() {} });
      const expected = app.engine.renderer.preview;
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 101 }));
      const saved = app.engine.model.objects.at(-1);
      if (Math.abs(Math.hypot(saved.x2 - saved.x1, saved.y2 - saved.y1) - 1) > 1e-10 || saved.x2 !== expected.end.x || saved.y2 !== expected.end.y) throw new Error('Commit before RAF differs from exact preview');
      begin(); app.cancel();
      const json = JSON.stringify(app.engine.toJSON()), html = document.getElementById('canvas').innerHTML;
      await new Promise(requestAnimationFrame);
      if (app.renderFrame !== null || json !== JSON.stringify(app.engine.toJSON()) || html !== document.getElementById('canvas').innerHTML) throw new Error('Cancelled frame resurrected state/rendering');
    });
    delete row.preview; delete row.saved;
  }
  return rows;
};
