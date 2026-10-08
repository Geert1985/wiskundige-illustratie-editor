const assert = require('node:assert/strict');
module.exports = async page => {
  const snapshot = () => page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON());
  const count = () => page.evaluate(() => FZI.MathIllustration.editor.history.entries.length);
  const move = async (x, y) => { const p = await page.evaluate(p => FZI.MathIllustration.editor.transform().mathToScreen(p), { x, y }); await page.mouse.move(p.x, p.y); };
  const drag = async (a, b) => { await move(...a); await page.mouse.down(); await move(...b); await page.mouse.up(); };
  const checks = [];
  async function check(name, action) {
    const before = await snapshot(), n = await count(); await action();
    const after = await snapshot(); assert.notDeepEqual(after, before, name);
    assert.equal(await count(), n + 1, name + ' one command');
    await page.locator('#undoBtn').click(); assert.deepEqual(await snapshot(), before, name + ' undo');
    await page.locator('#redoBtn').click(); assert.deepEqual(await snapshot(), after, name + ' redo');
    checks.push(name);
  }
  await page.evaluate(() => FZI.MathIllustration.editor.loadDocument({ objects: [], presentation: { bounds: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 }, showGrid: false } }));
  await check('point', async () => { await page.locator('[data-tool="point"]').click(); await move(-3, -2); await page.mouse.click(...Object.values(await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: -3, y: -2 })))); });
  for (const type of ['line', 'straight', 'ray', 'vector', 'circle']) {
    await page.evaluate(() => FZI.MathIllustration.editor.loadDocument({ objects: [], presentation: { showGrid: false } }));
    await check(type, async () => { await page.locator(`[data-tool="${type}"]`).click(); await drag([0, 0], [1, 0]); });
  }
  await page.evaluate(() => FZI.MathIllustration.editor.loadDocument({ objects: [{ id: 'l', type: 'line', x1: -1, y1: 0, x2: 1, y2: 0, showLabel: true, labelOffsetX: .2, labelOffsetY: .3 }], presentation: { showGrid: false } }));
  await page.locator('[data-select-object="l"]').click();
  await check('rigid drag', () => drag([0, 0], [.5, .5]));
  await check('endpoint', async () => { const b = await page.locator('.fzi-line-endpoint[data-endpoint="end"]').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await move(2, 1); await page.mouse.up(); });
  await check('label', async () => { const b = await page.locator('.object-label').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x + b.width / 2 + 20, b.y + b.height / 2 - 15); await page.mouse.up(); });
  await check('inspector', async () => { await page.locator('[data-edit="x2"]').fill('2.5'); await page.locator('[data-edit="y2"]').focus(); });
  await check('visibility', () => page.locator('[data-object-visibility="l"]').click());
  await check('color batch', async () => {
    await page.evaluate(() => { const app = FZI.MathIllustration.editor; app.colorId = 'l'; const input = app.colorInput; for (const value of ['#123456', '#654321']) { input.value = value; input.dispatchEvent(new Event('input')); } input.dispatchEvent(new Event('change')); });
  });
  await check('axes', () => page.locator('[data-view="axes"]').click());
  await check('pan', () => drag([-4, -2], [-3.5, -1.5]));
  await check('zoom', async () => { await move(0, 0); await page.mouse.wheel(0, -100); await page.waitForTimeout(100); });
  await page.locator('summary').filter({ hasText: /^Illustratie$/ }).click();
  await check('metadata typing batch', async () => { await page.locator('#titleInput').fill('Nieuwe titel'); await page.locator('#titleInput').press('End'); await page.locator('#titleInput').pressSequentially(' abc'); await page.locator('#descriptionInput').focus(); });
  const beforeCancel = await snapshot(), n = await count();
  await move(-4, -2); await page.mouse.down(); await move(-3, -1); await page.keyboard.press('Escape'); await page.mouse.up();
  assert.deepEqual(await snapshot(), beforeCancel); assert.equal(await count(), n);
  await page.locator('[data-select-object="l"]').click();
  await check('delete', () => page.locator('[data-delete-selected]').click());
  await page.keyboard.press('Control+z'); assert.equal(await page.locator('[data-edit="x2"]').inputValue(), '2.5');
  await page.keyboard.press('Control+Shift+z'); assert.equal(await page.locator('[data-edit="x2"]').count(), 0);
  await page.locator('#saveBtn').click(); const saved = await snapshot(); await page.reload();
  assert.deepEqual(await snapshot(), saved); assert.equal(await page.locator('#undoBtn').isDisabled(), true);
  await page.evaluate(() => localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
  return { checks, cancelledGesture: 'passed', shortcuts: 'passed', saveReload: 'passed', transientHistory: 'passed' };
};
