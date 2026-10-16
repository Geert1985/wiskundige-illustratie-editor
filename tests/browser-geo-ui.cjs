const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async page => {
  await page.setViewportSize({ width: 1040, height: 1000 });
  const doc = () => page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON());
  const select = async (id, filter = 'measurement') => page.evaluate(({ id, filter }) => {
    const app = FZI.MathIllustration.editor;
    app.selectObject(id);
    app.radialProperties.openAt({ x: innerWidth / 2, y: innerHeight / 2 }, false);
    app.radialProperties.choose(filter);
  }, { id, filter });
  const load = objects => page.evaluate(objects => FZI.MathIllustration.editor.loadDocument({
    ...(objects.some(object => object.type === 'ellipse') ? { version: 9, ellipseSchema: 1 } : {}),
    meta: { measurement: { schema: 1, unit: 'cm', scale: 1, precision: 2 } },
    objects, presentation: { bounds: { xMin: -6, xMax: 6, yMin: -4, yMax: 4 }, showGrid: false, showAxes: false }
  }), objects);

  await load([{ id: 'C', type: 'circle', cx: 0, cy: 0, r: 3, showMeasurement: true }]);
  await select('C', 'geometry');
  assert.equal(await page.locator('[data-edit="showMeasurement"]').count(), 0, 'supported circle exposes no legacy duplicate switch');
  assert.equal(await page.locator('[data-measurement-control][data-measurement-field="visible"]').count(), 4);
  assert.equal(await page.locator('[data-measurement-control][data-measurement-key="radius"][data-measurement-field="visible"]').isChecked(), true, 'legacy circle visibility maps to radius only');
  for (const key of ['diameter', 'circumference', 'area']) assert.equal(await page.locator(`[data-measurement-control][data-measurement-key="${key}"][data-measurement-field="visible"]`).isChecked(), false);
  assert.equal(await page.locator('.measurement-entry').count(), 4);

  await page.locator('[data-measurement-control][data-measurement-key="circumference"][data-measurement-field="visible"]').check();
  await page.locator('[data-measurement-control][data-measurement-key="area"][data-measurement-field="visible"]').check();
  assert.equal(await page.locator('[data-object-id="C"] [data-measurement-kind]').count(), 3);
  assert.match(await page.locator('[data-measurement-kind="radius"]').textContent(), /3,00 cm/);
  assert.match(await page.locator('[data-measurement-kind="circumference"]').textContent(), /18,85 cm/);
  assert.match(await page.locator('[data-measurement-kind="area"]').textContent(), /28,27 cm²/);
  assert.equal(await page.locator('[data-measurement-kind="diameter"]').count(), 0);

  const state = await doc();
  assert.equal(state.version, 10);
  assert.equal(state.measurementSchema, 1);
  await page.locator('.measurement-entry').filter({ hasText: 'Oppervlakte' }).locator('details > summary').click();
  await page.locator('[data-measurement-control][data-measurement-key="area"][data-measurement-field="precision"]').fill('1');
  await page.locator('.measurement-entry').filter({ hasText: 'Omtrek' }).locator('details > summary').click();
  assert.match(await page.locator('[data-measurement-kind="area"]').textContent(), /28,3 cm²/);

  await page.locator('#undoBtn').click();
  assert.equal((await doc()).objects[0].measurements.values.area.precision, null);
  await page.locator('#redoBtn').click();
  assert.equal((await doc()).objects[0].measurements.values.area.precision, 1);

  const beforeDrag = await doc();
  const box = await page.locator('[data-measurement-kind="circumference"]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 32, box.y + box.height / 2 + 18);
  await page.mouse.up();
  const afterDrag = await doc();
  assert.notEqual(afterDrag.objects[0].measurements.values.circumference.dx, beforeDrag.objects[0].measurements.values.circumference.dx);
  assert.equal(afterDrag.objects[0].measurements.values.radius.dx, beforeDrag.objects[0].measurements.values.radius.dx);
  await select('C', 'measurement');
  await page.locator('[data-measurement-control][data-measurement-key="circumference"][data-measurement-field="visible"]').uncheck();
  await page.locator('[data-measurement-control][data-measurement-key="circumference"][data-measurement-field="visible"]').check();
  assert.equal((await doc()).objects[0].measurements.values.circumference.dx, afterDrag.objects[0].measurements.values.circumference.dx, 'hide/show retains its offset');
  await page.locator('.measurement-entry').filter({ hasText: 'Omtrek' }).locator('details > summary').click();
  await page.locator('[data-measurement-reset="circumference"]').click();
  assert.equal((await doc()).objects[0].measurements.values.circumference.dx, 0);
  await page.locator('#undoBtn').click();
  assert.equal((await doc()).objects[0].measurements.values.circumference.dx, afterDrag.objects[0].measurements.values.circumference.dx);

  await select('C', 'measurement');
  assert.equal(await page.locator('[data-property-section="measurements"]').isVisible(), true, 'Meting opens the shared measurements section');
  const filterState=await page.evaluate(()=>({filter:document.getElementById('propertiesSidebar').dataset.radialFilter,mode:FZI.MathIllustration.editor.radialProperties.detailMode,groups:Array.from(document.querySelectorAll('#selectionPanel > [data-property-section]')).map(node=>[node.dataset.propertySection,node.hidden])}));
  assert.equal(await page.locator('[data-property-section="object-geometry"]').isVisible(), false, JSON.stringify(filterState));
  await select('C', 'all');
  assert.equal(await page.locator('[data-property-section="measurements"]').isVisible(), true);
  assert.equal(await page.locator('[data-property-section="object-geometry"]').isVisible(), true);
  await select('C', 'geometry');
  assert.equal(await page.locator('[data-property-section="measurements"]').isVisible(), true);

  const screenshotDir = path.join(__dirname, '..', 'docs', 'images', 'geo-ui-regression');
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.locator('#propertiesSidebar').screenshot({ path: path.join(screenshotDir, 'circle-measurements-edge.png') });

  const vertices = Array.from({ length: 12 }, (_, i) => ({ x: 3 * Math.cos(i * Math.PI / 6), y: 3 * Math.sin(i * Math.PI / 6) }));
  await load([
    { id: 'L', type: 'line', x1: -4, y1: 0, x2: -2, y2: 0 },
    { id: 'S', type: 'straight', x1: -4, y1: 1, x2: -2, y2: 1 },
    { id: 'R', type: 'ray', x1: -4, y1: 2, x2: -2, y2: 2 },
    { id: 'C', type: 'circle', cx: 0, cy: 0, r: 3 },
    { id: 'A', type: 'angle', vertices: [{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }] },
    { id: 'P', type: 'polygon', vertices },
    { id: 'E', type: 'ellipse', cx: 0, cy: 0, a: 4, b: 2, rotation: 0 }
  ]);
  for (const id of ['L', 'C', 'A', 'P', 'E']) {
    await select(id, 'measurement');
    assert.ok(await page.locator('[data-measurement-control][data-measurement-field="visible"]').count() > 0, `${id} has supported individual measurements`);
  }
  for (const id of ['S', 'R']) {
    await select(id, 'geometry');
    assert.equal(await page.locator('[data-measurement-control]').count(), 0, `${id} has no finite-length measurement controls`);
    assert.equal(await page.locator('[data-measurement-kind]').count(), 0, `${id} has no finite-length labels`);
  }
  await select('P', 'measurement');
  const panelMetrics = await page.locator('#propertiesSidebar').evaluate(el => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, overflowY: getComputedStyle(el).overflowY }));
  assert.ok(panelMetrics.scrollHeight > panelMetrics.clientHeight, 'large measurement lists scroll inside the floating panel');
  assert.equal(panelMetrics.overflowY, 'auto');
  await page.locator('#propertiesSidebar').screenshot({ path: path.join(screenshotDir, 'polygon-measurements-edge.png') });
  await page.locator('#propertiesSidebar').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await page.locator('#propertiesSidebar').evaluate(el => { el.scrollTop = 0; });

  await load([{ id: 'O', type: 'point', x: 0, y: 0 }, { id: 'Q', type: 'point', x: 3, y: 0 }]);
  const dependentId = await page.evaluate(() => {
    const app = FZI.MathIllustration.editor;
    let id;
    app.changeDocument(() => { id = app.execute('construction.create', { toolId: 'construct:circleByCenterPoint', sources: [{ objectId: 'O' }, { objectId: 'Q' }] }).result[0].id; });
    return id;
  });
  await select(dependentId, 'measurement');
  await page.locator('[data-measurement-control][data-measurement-key="radius"][data-measurement-field="visible"]').check();
  await page.locator('[data-measurement-control][data-measurement-key="circumference"][data-measurement-field="visible"]').check();
  assert.match(await page.locator(`[data-label-id="${dependentId}"][data-measurement-kind="circumference"]`).textContent(), /18,85/);
  await page.evaluate(() => { const app = FZI.MathIllustration.editor; app.changeDocument(() => app.execute('object.setGeometry', { id: 'Q', fields: [{ path: 'x', value: 4 }] })); });
  assert.match(await page.locator(`[data-label-id="${dependentId}"][data-measurement-kind="radius"]`).textContent(), /4,00/);
  assert.match(await page.locator(`[data-label-id="${dependentId}"][data-measurement-kind="circumference"]`).textContent(), /25,13/);

  const saved = await doc();
  await page.locator('#saveBtn').click();
  await page.reload();
  assert.deepEqual(await doc(), saved, 'v10 document saves and reopens intact');
  const imported = page.waitForFunction(() => document.getElementById('status').textContent === 'Illustratie geladen.');
  await page.locator('#fileInput').setInputFiles({ name: 'geo-ui-v10.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await imported;
  assert.deepEqual(await doc(), saved, 'v10 JSON import preserves measurements and offsets');
  await page.evaluate(() => localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
  return {
    compactCircleControls: 'passed', independentCircleVisibility: '4 values / 16 states covered in Node',
    numericalValuesAndUnits: 'passed', precision: 'passed', labelDragResetUndoRedo: 'passed',
    radialGeometryMeasurementAll: 'passed', linearObjectsAndFiniteLengthPolicy: 'passed',
    polygonPanelScroll: panelMetrics, dependentRecalculation: 'passed', v10SaveReloadImport: 'passed',
    screenshots: ['docs/images/geo-ui-regression/circle-measurements-edge.png', 'docs/images/geo-ui-regression/polygon-measurements-edge.png']
  };
};
