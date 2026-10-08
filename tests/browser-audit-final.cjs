const assert = require('node:assert/strict');
module.exports = async page => {
  for (const width of [900, 1280]) for (const span of [2, 10, 100]) for (const type of ['point', 'line']) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(({ span, type }) => {
      const app = FZI.MathIllustration.editor;
      app.loadDocument({ objects: [type === 'point' ? { id: 'target', type, x: 0, y: 0 } : { id: 'target', type, x1: -span / 2, y1: 0, x2: span / 2, y2: 0 }], presentation: { bounds: { xMin: -span, xMax: span, yMin: -span, yMax: span }, showGrid: false } }); app.setTool('select');
    }, { span, type });
    const origin = await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: 0, y: 0 }));
    await page.mouse.move(origin.x, origin.y + 7); await page.mouse.down(); await page.mouse.up();
    assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.selectedId), 'target', `${type}/${width}/${span}: 7px`);
    await page.mouse.move(origin.x, origin.y + 9); await page.mouse.down(); await page.mouse.up();
    assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.selectedId), null, `${type}/${width}/${span}: 9px`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => {
    const app = FZI.MathIllustration.editor;
    app.loadDocument({ objects: [{ id: 'c', type: 'circle', cx: 0, cy: 0, r: .5 }, { id: 'text', type: 'text', text: 'WWWWWWWWWWWWWW', x: -2, y: 1 }], presentation: { bounds: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 }, showGrid: false } }); app.setTool('select');
  });
  const text = await page.locator('[data-object-id="text"] text').boundingBox();
  await page.mouse.move(text.x + text.width * .8, text.y + text.height / 2); await page.mouse.down();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.selectedId), 'text');
  await page.mouse.move(text.x + text.width * .8 + 20, text.y + text.height / 2); await page.mouse.up();
  assert.ok(await page.evaluate(() => FZI.MathIllustration.editor.engine.get('text').x > -2));
  await page.locator('[data-select-object="c"]').click();
  const before = await page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON());
  await page.locator('[data-edit="r"]').fill('-1'); await page.locator('[data-edit="r"]').press('Tab');
  assert.deepEqual(await page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON()), before);
  assert.match(await page.locator('#status').textContent(), /negatief/);
  assert.equal(await page.locator('[data-edit="r"]').inputValue(), '0.5');
  await page.locator('[data-edit="r"]').fill(''); await page.locator('[data-edit="r"]').press('Tab');
  assert.deepEqual(await page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON()), before);
  assert.match(await page.locator('#status').textContent(), /coördinaat/);
  const style = await page.evaluate(() => {
    const engine = FZI.MathIllustration.editor.engine;
    engine.update('c', { style: { dash: '4 2', opacity: .4, extension: { a: 1, b: 2 } } });
    engine.update('c', { style: { stroke: '#123456', extension: { a: 3 } } });
    const snapshot = engine.get('c'); snapshot.cx = 99; snapshot.style.extension.a = 99;
    const saved = engine.toJSON(); engine.load(saved);
    return engine.get('c');
  });
  assert.equal(style.cx, 0); assert.equal(style.style.opacity, .4); assert.equal(style.style.dash, '4 2'); assert.deepEqual(style.style.extension, { a: 3, b: 2 });
  return { screenSelectionCases: 24, textBodyDrag: 'passed', invalidInspectorRollback: 'passed', styleMergeRoundtrip: 'passed', detachedGet: 'passed' };
};
