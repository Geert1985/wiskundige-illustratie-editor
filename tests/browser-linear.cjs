const assert = require('node:assert/strict');
const fs = require('node:fs');
module.exports = async page => {
  const savedTypes = [];
  const move = async (x, y) => { const p = await page.evaluate(p => FZI.MathIllustration.editor.transform().mathToScreen(p), { x, y }); await page.mouse.move(p.x, p.y); };
  for (const type of ['straight', 'ray', 'vector']) {
    await page.evaluate(() => { const app = FZI.MathIllustration.editor; app.loadDocument({ objects: [], presentation: { bounds: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 }, showGrid: false } }); });
    await require('./browser-tool-menu.cjs').choose(page,`[data-tool="${type}"]`); await move(0, 0); await page.mouse.down(); await move(1.1, 0); await page.keyboard.press('1');
    const preview = await page.evaluate(() => FZI.MathIllustration.editor.engine.renderer.preview);
    assert.equal(preview.type, type); assert.equal(await page.locator('[data-drawing-preview]').count(), 1);
    await page.mouse.up(); let object = await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects[0]);
    assert.equal(object.type, type); assert.equal(object.x2, preview.end.x); assert.equal(object.y2, preview.end.y);
    assert.ok(Math.abs(Math.hypot(object.x2 - object.x1, object.y2 - object.y1) - 1) < 1e-9);
    await require('./browser-tool-menu.cjs').choose(page,'[data-tool="select"]'); await move(.5, 0); await page.mouse.down(); await move(.8, .4); await page.mouse.up();
    object = await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects[0]);
    assert.ok(Math.abs(object.x2 - object.x1 - 1) < 1e-9); assert.ok(Math.abs(object.y2 - object.y1) < 1e-9);
    const beforeCancel = await page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON());
    await move((object.x1 + object.x2) / 2, object.y1); await page.mouse.down(); await move(1.5, 1.5); await page.keyboard.press('Escape'); await page.mouse.up();
    assert.deepEqual(await page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON()), beforeCancel);
    await page.evaluate(() => { const app = FZI.MathIllustration.editor; app.engine.renderer.showGrid = true; app.invalidate(); });
    const handle = await page.locator('.fzi-line-endpoint[data-endpoint="end"]').boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2); await page.mouse.down(); await move(2.03, 1.02);
    assert.equal(await page.locator('[data-edit="x2"]').inputValue(), '2');
    await page.mouse.up(); object = await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects[0]);
    assert.equal(object.x2, 2); assert.equal(object.y2, 1);
    await page.evaluate(id => { const app = FZI.MathIllustration.editor; app.engine.update(id, { showLabel: true, labelOffsetX: .2, labelOffsetY: .2 }); app.invalidate(); }, object.id);
    const label = await page.locator('.object-label').boundingBox();
    await page.mouse.move(label.x + label.width / 2, label.y + label.height / 2); await page.mouse.down(); await page.mouse.move(label.x + label.width / 2 + 20, label.y + label.height / 2 - 10); await page.mouse.up();
    object = await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects[0]); assert.ok(object.labelOffsetX > .2);
    const downloadEvent = page.waitForEvent('download'); await require('./browser-tool-menu.cjs').action(page,'#exportSvgBtn');
    const svg = fs.readFileSync(await (await downloadEvent).path(), 'utf8'); assert.match(svg, /data-direction-arrow/); assert.doesNotMatch(svg, /NaN|Infinity|fzi-line-endpoint/);
    const document = await page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON());
    await page.locator('#saveBtn').click(); await page.reload();
    assert.deepEqual(await page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON()), document);
    await page.locator('#fileInput').setInputFiles({ name: 'linear.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(document)) });
    await page.waitForFunction(() => document.getElementById('status').textContent === 'Illustratie geladen.');
    assert.deepEqual(await page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON()), document);
    savedTypes.push(type);
  }
  for (const type of ['straight', 'ray', 'vector']) {
    const target = type === 'vector' ? .5 : 2;
    await page.evaluate(({ type, target }) => { const app = FZI.MathIllustration.editor; app.loadDocument({ objects: [{ id: 'a', type, x1: 0, y1: 0, x2: 1, y2: 0 }, { id: 'b', type: 'line', x1: target, y1: -1, x2: target, y2: 1 }], presentation: { bounds: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 }, showGrid: false } }); }, { type, target });
    await require('./browser-tool-menu.cjs').choose(page,'[data-tool="point"]'); await move(target + .02, .02); await page.mouse.down(); await page.mouse.up();
    const p = await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects.at(-1)); assert.equal(p.x, target); assert.equal(p.y, 0);
    await page.evaluate(() => FZI.MathIllustration.editor.loadDocument({ objects: [], presentation: { showGrid: false } }));
    await require('./browser-tool-menu.cjs').choose(page,`[data-tool="${type}"]`); await move(0, 0); await page.mouse.down(); await move(.01, 0); await page.mouse.up();
    assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects.length), 0);
    assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.renderer.preview), null);
  }
  await page.evaluate(() => localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
  return { types: savedTypes, exactMeasurement: 'passed', rigidTranslation: 'passed', endpointGrid: 'passed', labelDrag: 'passed', Escape: 'passed', SVGExport: 'passed', saveReloadImport: 'passed', intersectionSnapping: 'passed', shortShapeCleanup: 'passed' };
};
