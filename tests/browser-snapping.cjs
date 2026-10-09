const assert = require('node:assert/strict');
module.exports = async function verifySnapping(page) {
  let serial = 0;
  const close = (value, wanted) => assert.ok(Math.abs(value - wanted) < 1e-9, `${value} != ${wanted}`);
  const load = async (objects = [], showGrid = false) => {
    const title = '0C-' + ++serial;
    const data = { version: 2, type: 'geometry', meta: { title }, objects, presentation: { bounds: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 }, showGrid, showSnapPoints: true } };
    await require('./browser-tool-menu.cjs').importFile(page,{ name: '0c.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
    await page.waitForFunction(title => FZI.MathIllustration.activeEngine.model.meta.title === title, title);
    await require('./browser-tool-menu.cjs').choose(page,'[data-tool="select"]');
  };
  const screen = point => page.evaluate(point => FZI.MathIllustration.CoordinateTransform.forCanvas(FZI.MathIllustration.activeEngine).mathToScreen(point), point);
  const move = async (x, y) => { const p = await screen({ x, y }); await page.mouse.move(p.x, p.y); };
  const preview = () => page.evaluate(() => FZI.MathIllustration.activeEngine.renderer.preview);
  const objects = () => page.evaluate(() => FZI.MathIllustration.activeEngine.model.all());
  const begin = async (shape, x = 0, y = 0) => { await require('./browser-tool-menu.cjs').choose(page,`[data-tool="${shape}"]`); await move(x, y); await page.mouse.down(); };
  const marker = () => page.evaluate(() => {
    const circle = document.querySelector('#canvas .fzi-snap-indicator circle');
    if (!circle) return null;
    const r = FZI.MathIllustration.activeEngine.renderer;
    return { x: r.bounds.xMin + (+circle.getAttribute('cx') - r.padding) / r.scale(), y: r.bounds.yMin + (r.height - r.padding - +circle.getAttribute('cy')) / r.scale() };
  });
  // Competing point/grid candidates: marker, preview and commit agree.
  await load([{ id: 'p', type: 'point', x: 1.05, y: 0 }], true);
  await begin('line'); await move(1.02, 0);
  const snapped = await preview(); close(snapped.end.x, 1.05); close((await marker()).x, snapped.end.x);
  await page.mouse.up(); close((await objects()).find(o => o.type === 'line').x2, snapped.end.x);
  // The original 1 -> 1.05 defect, now with keyboard exact distance and no new pointer sample.
  for (const shape of ['line', 'circle']) {
    await load([{ id: 'p', type: 'point', x: 1.05, y: 0 }], true);
    await begin(shape); await move(1.02, 0); await page.keyboard.press('1');
    const exact = await preview(); close(Math.hypot(exact.end.x - exact.start.x, exact.end.y - exact.start.y), 1); assert.equal(await marker(), null);
    await page.keyboard.press('Enter'); await page.mouse.up();
    const saved = (await objects()).find(o => o.type === shape);
    if (shape === 'line') { close(Math.hypot(saved.x2 - saved.x1, saved.y2 - saved.y1), 1); close(saved.x2, exact.end.x); close(saved.y2, exact.end.y); }
    else assert.equal(saved.r, 1);
  }
  // Entire line translates rigidly while its far endpoint snaps to a point.
  await load([{ id: 'p', type: 'point', x: 1.1, y: 0 }, { id: 'l', type: 'line', x1: 0, y1: 0, x2: 1, y2: 0 }]);
  await move(.5, 0); await page.mouse.down(); await move(.55, 0);
  let line = (await objects()).find(o => o.id === 'l'); close(line.x1, .1); close(line.x2, 1.1); close(line.x2 - line.x1, 1);
  await page.mouse.up();
  // A selected endpoint independently snaps to grid; its other endpoint is untouched.
  await load([{ id: 'l', type: 'line', x1: .3, y1: .3, x2: 1.3, y2: .3 }], true);
  await page.locator('[data-select-object="l"]').click();
  await page.locator('.fzi-line-endpoint[data-endpoint="end"]').waitFor();
  const handle = await page.locator('.fzi-line-endpoint[data-endpoint="end"]').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2); await page.mouse.down();
  await move(2.04, .02); const endMarker = await marker(); close(endMarker.x, 2); close(endMarker.y, 0);
  assert.equal((await objects()).find(o => o.id === 'l').x2, 1.3); // preview did not mutate the document
  await page.mouse.up(); line = (await objects()).find(o => o.id === 'l');
  close(line.x1, .3); close(line.y1, .3); close(line.x2, 2); close(line.y2, 0);
  await load([{ id: 'p', type: 'point', x: 2, y: 1 }, { id: 'l', type: 'line', x1: .3, y1: .3, x2: 1.3, y2: .3 }]);
  await page.locator('[data-select-object="l"]').click();
  await page.locator('.fzi-line-endpoint[data-endpoint="end"]').waitFor();
  const pointHandle = await page.locator('.fzi-line-endpoint[data-endpoint="end"]').boundingBox();
  await page.mouse.move(pointHandle.x + pointHandle.width / 2, pointHandle.y + pointHandle.height / 2); await page.mouse.down(); await move(2.03, 1.02);
  close((await marker()).x, 2); close((await marker()).y, 1);
  await page.mouse.up(); line = (await objects()).find(o => o.id === 'l');
  close(line.x1, .3); close(line.y1, .3); close(line.x2, 2); close(line.y2, 1);
  // All intersection types through real point placement, not only service calls.
  for (const [source, target] of [
    [[{ id: 'h', type: 'line', x1: -2, y1: 0, x2: 2, y2: 0 }, { id: 'v', type: 'line', x1: 0, y1: -2, x2: 0, y2: 2 }], { x: 0, y: 0 }],
    [[{ id: 'l', type: 'line', x1: -3, y1: 0, x2: 3, y2: 0 }, { id: 'c', type: 'circle', cx: 0, cy: 0, r: 2 }], { x: -2, y: 0 }],
    [[{ id: 'a', type: 'circle', cx: 0, cy: 0, r: 2 }, { id: 'b', type: 'circle', cx: 2, cy: 0, r: 2 }], { x: 1, y: Math.sqrt(3) }]
  ]) {
    await load(source); await require('./browser-tool-menu.cjs').choose(page,'[data-tool="point"]'); await move(target.x + .02, target.y + .02);
    const indication = await marker(); close(indication.x, target.x); close(indication.y, target.y);
    await page.mouse.down(); await page.mouse.up(); const point = (await objects()).find(o => o.type === 'point');
    close(point.x, indication.x); close(point.y, indication.y);
  }
  // Typed distance at the first click uses +x; keyboard backspace uses last raw direction.
  await load(); await begin('circle'); await page.keyboard.press('1');
  const initial = await preview(); close(initial.end.x - initial.start.x, 1); close(initial.end.y - initial.start.y, 0);
  await page.mouse.up(); assert.equal((await objects())[0].r, 1);
  await load(); await begin('line'); await move(0, 2); await page.keyboard.type('12'); await page.keyboard.press('Backspace');
  const typed = await preview(); close(Math.hypot(typed.end.x - typed.start.x, typed.end.y - typed.start.y), 1); assert.ok(typed.end.y - typed.start.y > .99);
  await page.keyboard.press('Enter'); await page.mouse.up(); close((await objects())[0].y2, typed.end.y);
  // Both zero-length and explicitly tiny shapes clean their preview and measurement state.
  for (const shape of ['line', 'circle']) {
    await load(); await begin(shape); await move(.01, 0); await page.mouse.up();
    assert.equal((await objects()).length, 0); assert.equal(await preview(), null);
    assert.equal(await page.locator('[data-drawing-preview]').count(), 0);
    await begin(shape); await page.keyboard.type('0.01'); await page.mouse.up();
    assert.equal((await objects()).length, 0); assert.equal(await preview(), null);
    await begin(shape); await move(2, 0); const fresh = await preview(); await page.mouse.up(); const saved = (await objects())[0];
    const length = shape === 'line' ? Math.hypot(saved.x2 - saved.x1, saved.y2 - saved.y1) : saved.r;
    close(length, Math.hypot(fresh.end.x - fresh.start.x, fresh.end.y - fresh.start.y)); assert.ok(length > 1.9);
  }
  // Responsive tolerance uses actual CSS pixels, not SVG user units.
  for (const width of [900, 1500]) {
    await page.setViewportSize({ width, height: 900 }); await load([{ id: 'p', type: 'point', x: 0, y: 0 }]);
    await require('./browser-tool-menu.cjs').choose(page,'[data-tool="point"]'); const origin = await screen({ x: 0, y: 0 });
    await page.mouse.move(origin.x + 11, origin.y); assert.ok(await marker());
    await page.mouse.move(origin.x + 13, origin.y); assert.equal(await marker(), null);
  }
  return { previewCommit: 'passed', exactLength1: 'passed', exactRadius1: 'passed', rigidTranslation: 'passed', endpointGrid: 'passed', endpointPoint: 'passed', intersections: 'passed', keyboardMeasurement: 'passed', shortShapeCleanup: 'passed', responsiveTolerance: 'passed' };
};
