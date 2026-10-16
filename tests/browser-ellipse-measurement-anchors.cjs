const assert = require('node:assert/strict');

module.exports = async page => {
  await page.setViewportSize({ width: 1180, height: 900 });
  const doc = () => page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON());
  const select = async id => page.evaluate(id => {
    const app = FZI.MathIllustration.editor;
    app.setTool('select');
    app.selectObject(id);
    app.radialProperties.openAt({ x: innerWidth / 2, y: innerHeight / 2 }, false);
    app.radialProperties.choose('measurement');
  }, id);
  const labelsFor = id => page.locator(`#canvas .object-label[data-label-id="${id}"][data-measurement-kind]`);
  const labelFor = (id, key) => page.locator(`#canvas .object-label[data-label-id="${id}"][data-measurement-kind="${key}"]`);
  const controlsFor = id => page.locator(`[data-measurement-control][data-measurement-key="${id}"][data-measurement-field="visible"]`);
  const enableAll = async id => {
    await select(id);
    for (const key of ['semiMajor', 'semiMinor', 'majorAxis', 'minorAxis', 'eccentricity', 'area']) await controlsFor(key).check();
  };
  const assertSixValidLabels = async id => {
    const keys = ['semiMajor', 'semiMinor', 'majorAxis', 'minorAxis', 'eccentricity', 'area'];
    assert.equal(await labelsFor(id).count(), 6, `${id} has six individual visible ellipse labels`);
    const coordinates = await labelsFor(id).evaluateAll(nodes => nodes.map(node => ({
      kind: node.getAttribute('data-measurement-kind'),
      x: Number(node.getAttribute('x')),
      y: Number(node.getAttribute('y'))
    })));
    assert.deepEqual(coordinates.map(value => value.kind).sort(), [...keys].sort());
    for (const point of coordinates) assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), `${point.kind} has finite SVG coordinates`);
    const exported = await page.evaluate(id => {
      const markup = FZI.MathIllustration.editor.engine.renderSVG(), xml = new DOMParser().parseFromString(markup, 'image/svg+xml');
      return { parseError: !!xml.querySelector('parsererror'), coordinates: Array.from(xml.querySelectorAll(`g[data-object-id="${id}"] text[data-measurement-kind]`)).map(node => ({
        kind: node.getAttribute('data-measurement-kind'), x: Number(node.getAttribute('x')), y: Number(node.getAttribute('y'))
      })) };
    }, id);
    assert.equal(exported.parseError, false, 'export is valid SVG/XML');
    assert.equal(exported.coordinates.length, 6, 'export contains all six independent ellipse labels');
    for (const point of exported.coordinates) assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), `exported ${point.kind} coordinates are finite`);
  };
  const offsets = async id => page.evaluate(id => {
    const object = FZI.MathIllustration.editor.engine.get(id);
    return Object.fromEntries(Object.entries(object.measurements.values).map(([key, value]) => [key, { dx: value.dx, dy: value.dy }]));
  }, id);
  const createFree = async ({ id, cx, cy, rotation }) => page.evaluate(({ id, cx, cy, rotation }) => {
    const app = FZI.MathIllustration.editor;
    app.loadDocument({ version: 9, ellipseSchema: 1, objects: [{ id, type: 'ellipse', cx, cy, a: 5, b: 3, rotation }], presentation: { bounds: { xMin: -20, xMax: 20, yMin: -16, yMax: 16 }, showGrid: false, showAxes: false } });
    return app.engine.get(id);
  }, { id, cx, cy, rotation });
  const createDependent = async ({ id, cx, cy, rotation }) => page.evaluate(({ id, cx, cy, rotation }) => {
    const app = FZI.MathIllustration.editor, focalDistance = 3, dx = focalDistance * Math.cos(rotation), dy = focalDistance * Math.sin(rotation);
    app.newDocument();
    app.engine.add({ id: 'focusA', type: 'point', x: cx - dx, y: cy - dy });
    app.engine.add({ id: 'focusB', type: 'point', x: cx + dx, y: cy + dy });
    const ellipse = app.engine.construct('ellipseByFociAndSum', [{ objectId: 'focusA' }, { objectId: 'focusB' }], 12)[0];
    app.invalidate();
    return { id: ellipse.id, cType: typeof ellipse.c, cx: ellipse.cx, cy: ellipse.cy, rotation: ellipse.rotation };
  }, { id, cx, cy, rotation });

  let free = await createFree({ id: 'freeEllipse', cx: 0, cy: 0, rotation: 0 });
  assert.equal(typeof free.c, 'number', 'resolved ellipse stores c as focal distance');
  await enableAll('freeEllipse');
  await assertSixValidLabels('freeEllipse');
  assert.equal(await page.locator('.measurement-entry').count(), 6);
  for (const key of ['semiMajor', 'semiMinor', 'majorAxis', 'minorAxis', 'eccentricity', 'area']) {
    const anchor = await page.evaluate(({ id, key }) => FZI.MathIllustration.MeasurementGeometry.measurementAnchor(FZI.MathIllustration.editor.engine.get(id), key), { id: 'freeEllipse', key });
    assert.ok(Number.isFinite(anchor.x) && Number.isFinite(anchor.y));
  }
  await page.locator('#propertiesClose').click();

  // Exercise every independent label target and prove only that label's offset changes.
  for (const key of ['semiMajor', 'semiMinor', 'majorAxis', 'minorAxis', 'eccentricity', 'area']) {
    const before = await offsets('freeEllipse'), box = await labelFor('freeEllipse', key).boundingBox();
    assert.ok(box, `${key} label is selectable`);
    const hitState = await page.evaluate(({ x, y }) => {
      const target = document.elementFromPoint(x, y);
      return { tag: target?.tagName, className: target?.getAttribute('class'), kind: target?.getAttribute('data-measurement-kind'), pointerEvents: target && getComputedStyle(target).pointerEvents, html: target?.outerHTML?.slice(0, 160) };
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const dragMode = await page.evaluate(() => FZI.MathIllustration.editor.interaction?.mode || null);
    await page.mouse.move(box.x + box.width / 2 + 28, box.y + box.height / 2 + 17, { steps: 4 });
    await page.mouse.up();
    const after = await offsets('freeEllipse');
    assert.ok(after[key].dx !== before[key].dx || after[key].dy !== before[key].dy, `${key} label moved: ${JSON.stringify({ hitState, dragMode, before: before[key], after: after[key], selection: await page.evaluate(() => FZI.MathIllustration.editor.selectedIds), tool: await page.evaluate(() => FZI.MathIllustration.editor.tool), status: await page.locator('#status').textContent() })}`);
    for (const other of Object.keys(before)) if (other !== key) assert.deepEqual(after[other], before[other], `dragging ${key} leaves ${other} in place`);
  }

  const movedOffsets = await offsets('freeEllipse');
  await page.locator('#undoBtn').click();
  assert.notDeepEqual(await offsets('freeEllipse'), movedOffsets, 'undo reverses the last individual label drag');
  await page.locator('#redoBtn').click();
  assert.deepEqual(await offsets('freeEllipse'), movedOffsets, 'redo restores that label drag');

  await select('freeEllipse');
  await controlsFor('eccentricity').uncheck();
  await controlsFor('eccentricity').check();
  assert.deepEqual((await offsets('freeEllipse')).eccentricity, movedOffsets.eccentricity, 'hide/show retains the eccentricity label offset');
  const saved = await doc();
  await page.locator('#saveBtn').click();
  await page.reload();
  assert.deepEqual(await doc(), saved, 'free ellipse labels survive save and reopen');
  await assertSixValidLabels('freeEllipse');

  // Free rotated ellipse at a translated coordinate also uses its true center and axis frame.
  const rotatedFree = await createFree({ id: 'rotatedFree', cx: -11, cy: 7, rotation: Math.PI / 5 });
  assert.equal(typeof rotatedFree.c, 'number');
  await enableAll('rotatedFree');
  await assertSixValidLabels('rotatedFree');
  const rotatedAnchor = await page.evaluate(() => {
    const ellipse = FZI.MathIllustration.editor.engine.get('rotatedFree');
    return { center: { x: ellipse.cx, y: ellipse.cy }, anchor: FZI.MathIllustration.MeasurementGeometry.measurementAnchor(ellipse, 'semiMajor') };
  });
  assert.notDeepEqual(rotatedAnchor.center, rotatedAnchor.anchor);

  // Dependent examples cover both axis-aligned and rotated focus lines at translated centers.
  for (const scenario of [
    { id: 'linkedAxisEllipse', cx: 9, cy: -6, rotation: 0 },
    { id: 'linkedRotatedEllipse', cx: -8, cy: 5, rotation: -Math.PI / 4 }
  ]) {
    const linked = await createDependent(scenario);
    assert.equal(linked.cType, 'number');
    assert.ok(Math.abs(linked.cx - scenario.cx) < 1e-9 && Math.abs(linked.cy - scenario.cy) < 1e-9, 'dependent center equals the geometric midpoint');
    await enableAll(linked.id);
    await assertSixValidLabels(linked.id);
    const before = await page.evaluate(id => {
      const ellipse = FZI.MathIllustration.editor.engine.get(id);
      return { anchors: Object.fromEntries(['semiMajor', 'semiMinor', 'majorAxis', 'minorAxis', 'eccentricity', 'area'].map(key => [key, FZI.MathIllustration.MeasurementGeometry.measurementAnchor(ellipse, key)])), values: ellipse.measurements };
    }, linked.id);
    await page.evaluate(() => {
      const app = FZI.MathIllustration.editor;
      app.changeDocument(() => {
        app.execute('object.setGeometry', { id: 'focusA', fields: [{ path: 'x', value: -5 }, { path: 'y', value: 6 }] });
        app.execute('object.setGeometry', { id: 'focusB', fields: [{ path: 'x', value: 1 }, { path: 'y', value: 0 }] });
      });
    });
    const after = await page.evaluate(id => {
      const ellipse = FZI.MathIllustration.editor.engine.get(id);
      return Object.fromEntries(['semiMajor', 'semiMinor', 'majorAxis', 'minorAxis', 'eccentricity', 'area'].map(key => [key, FZI.MathIllustration.MeasurementGeometry.measurementAnchor(ellipse, key)]));
    }, linked.id);
    assert.notDeepEqual(after, before.anchors, 'dependent labels follow changed focus geometry');
    await assertSixValidLabels(linked.id);
  }

  await page.evaluate(() => localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
  return {
    sixEllipseMeasures: 'passed', finiteSvgCoordinates: 'passed',
    individualDragAndIsolation: '6 labels passed', hideShowUndoRedoSaveReload: 'passed',
    freeAxisAlignedAndRotated: 'passed', dependentAxisAlignedAndRotated: 'passed',
    dependentRecomputation: 'passed'
  };
};
