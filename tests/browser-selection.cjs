const assert = require('node:assert/strict');
module.exports = async page => {
  const objects = Array.from({ length: 499 }, (_, i) => ({ id: 'p-' + i, type: 'point', x: 2 + (i % 20) / 10, y: 1 + Math.floor(i / 20) / 20 }));
  objects.push({ id: 'circle', type: 'circle', cx: -2, cy: -1, r: .5 });
  const load = () => page.evaluate(objects => { const app = FZI.MathIllustration.editor; app.loadDocument({ objects, presentation: { bounds: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 }, showGrid: false } }); app.setTool('select'); }, objects);
  await load();
  const center = await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: -2, y: -1 }));
  await page.mouse.move(center.x, center.y); await page.mouse.down();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.interaction.mode), 'object', 'clicking the visible circle center must drag the circle');
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.selectedId), 'circle');
  const end = await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: -1, y: -1 }));
  await page.mouse.move(end.x, end.y); await page.mouse.up();
  const movedCircle = await page.evaluate(() => FZI.MathIllustration.editor.engine.get('circle'));
  assert.ok(Math.abs(movedCircle.cx + 1) < 1e-5, JSON.stringify(movedCircle)); // Real PointerEvent screen coordinates use float precision.
  // Overlap: the actually painted/topmost object wins over insertion-order mathematical hit testing.
  await page.evaluate(() => { const app = FZI.MathIllustration.editor; app.engine.add({ id: 'bottom', type: 'point', x: -2, y: -2 }); app.engine.add({ id: 'top', type: 'point', x: -2, y: -2 }); app.invalidate(); });
  const overlap = await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: -2, y: -2 }));
  await page.mouse.move(overlap.x, overlap.y); await page.mouse.down();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.selectedId), 'top');
  await page.keyboard.press('Escape'); await page.mouse.up();
  // A sidebar object selection must enter select mode, also after drawing many shapes.
  await page.locator('[data-tool="point"]').click();
  await page.locator('[data-select-object="circle"]').click();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.tool), 'select');
  const current = await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: -1, y: -1 }));
  await page.mouse.move(current.x, current.y); await page.mouse.down(); await page.mouse.move(current.x + 30, current.y); await page.mouse.up();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects.length), 502, 'drag must not add another point');
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.selectedId), 'circle');
  return { objects: 500, circleCenterDrag: 'passed', topmostSelection: 'passed', sidebarSelectionTool: 'passed' };
};
