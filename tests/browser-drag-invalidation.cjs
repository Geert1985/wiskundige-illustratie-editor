const assert = require('node:assert/strict');

module.exports = async page => {
  const start = await page.evaluate(() => {
    const app = FZI.MathIllustration.editor;
    app.newDocument();
    app.engine.add({ id: 'drag-point', type: 'point', x: 0, y: 0, name: 'P', showLabel: true });
    app.engine.add({ id: 'support-point', type: 'point', x: 3, y: 0, name: 'Q' });
    const midpoint = app.engine.construct('midpoint', [{ objectId: 'drag-point' }, { objectId: 'support-point' }])[0];
    app.selectObject('drag-point');
    const counts = { canvas: 0, list: 0, inspector: 0 };
    for (const [key, name] of [['renderCanvas', 'canvas'], ['renderViewList', 'list'], ['renderInspector', 'inspector']]) {
      const original = app[key].bind(app);
      app[key] = (...args) => { counts[name]++; return original(...args); };
    }
    window.__dragCounts = counts;
    return { midpoint: midpoint.id, start: app.transform().mathToScreen({ x: 0, y: 0 }), snapped: app.transform().mathToScreen({ x: 3.08, y: 0 }), list: app.nodes.viewList.innerHTML };
  });

  await page.mouse.move(start.start.x, start.start.y);
  await page.mouse.down();
  await page.evaluate(() => { for (const key of Object.keys(window.__dragCounts)) window.__dragCounts[key] = 0; });
  await page.mouse.move(start.snapped.x, start.snapped.y, { steps: 3 });
  await page.waitForFunction(id => {
    const app = FZI.MathIllustration.editor;
    return app.engine.get('drag-point').x > 2.9 && app.engine.get(id).x > 2.9;
  }, start.midpoint);
  const dragged = await page.evaluate(({ id, originalList }) => {
    const app = FZI.MathIllustration.editor;
    return { point: app.engine.get('drag-point').x, midpoint: app.engine.get(id).x, inspectorX: app.nodes.selectionPanel.querySelector('[data-edit="x"]')?.value, feedback: app.feedback?.snapped, counts: { ...window.__dragCounts }, listSame: app.nodes.viewList.innerHTML === originalList };
  }, { id: start.midpoint, originalList: start.list });
  const counters = await page.evaluate(() => {
    const app = FZI.MathIllustration.editor;
    return { canvas: app.nodes.canvas.querySelectorAll('svg').length, inspectorHasGeometry: app.nodes.selectionPanel.innerHTML.length > 0 };
  });
  assert.ok(dragged.point > 2.9 && dragged.midpoint > 2.9, 'source and dependent construction move together');
  assert.equal(dragged.inspectorX, '3', 'inspector coordinate follows the previewed source point');
  assert.equal(dragged.feedback, true, 'snap feedback is active near the support point');
  assert.equal(dragged.listSame, true, 'object-list DOM is retained during drag');
  assert.ok(dragged.counts.canvas > 0 && dragged.counts.inspector > 0 && counters.inspectorHasGeometry, 'canvas and inspector refresh during drag');
  assert.equal(dragged.counts.list, 0, 'object list is not rerendered during drag');
  await page.mouse.up();

  const committed = await page.evaluate(() => FZI.MathIllustration.editor.engine.get('drag-point').x);
  await page.evaluate(() => FZI.MathIllustration.editor.travelHistory(false));
  const undone = await page.evaluate(() => FZI.MathIllustration.editor.engine.get('drag-point').x);
  await page.evaluate(() => FZI.MathIllustration.editor.travelHistory(true));
  const redone = await page.evaluate(() => FZI.MathIllustration.editor.engine.get('drag-point').x);
  assert.ok(committed > 2.9 && undone === 0 && redone === committed, 'drag commits as one undo/redo step');

  for (const cancel of ['Escape', 'pointercancel']) {
    const point = await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: 3, y: 0 }));
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x - 35, point.y + 24, { steps: 2 });
    if (cancel === 'Escape') await page.keyboard.press('Escape');
    else await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 })));
    const rolledBack = await page.evaluate(() => ({ active: !!FZI.MathIllustration.editor.interaction, x: FZI.MathIllustration.editor.engine.get('drag-point').x }));
    assert.equal(rolledBack.active, false, `${cancel} releases drag ownership`);
    assert.ok(Math.abs(rolledBack.x - committed) < 1e-8, `${cancel} restores the committed point`);
    await page.mouse.up();
  }

  return { point: dragged.point, dependentMidpoint: dragged.midpoint, snapped: dragged.feedback, renderRoute: 'canvas + inspector; object list retained', history: 'undo/redo and cancellation verified' };
};
