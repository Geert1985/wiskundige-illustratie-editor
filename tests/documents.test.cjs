const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, fixture, plain } = require('./helpers.cjs');

test('failed document loads preserve all existing state and reject duplicate canonical IDs', () => {
  const { MI } = runtime(); const e = new MI.Engine(fixture('geometry.json'));
  const before = plain(e.toJSON());
  for (const data of [
    { meta: { title: 'new' }, objects: [{ id: 'a', type: 'point' }, { id: 'a', type: 'point' }] },
    { objects: [{ id: 1, type: 'point' }, { id: '1', type: 'point' }] },
    { meta: { title: 'new' }, objects: [{ id: 'x', type: 'unsupported' }] },
    { objects: [{ id: 'x', type: 'point', x: 'invalid' }] },
    { objects: [{ id: 'x', type: 'circle', r: -1 }] },
    { type: 'other', objects: [] }, { version: 999, objects: [] },
    { version: 'bad', objects: [] }, { version: true, objects: [] }, { meta: [], objects: [] }, { meta: { title: [] }, objects: [] }, { objects: [null] }, { objects: {} }, {}, [], null
  ]) {
    assert.throws(() => e.load(data));
    assert.deepEqual(plain(e.toJSON()), before);
  }
});
test('v1 legacy label migrates to name, explicit names win, and v2 names never remigrate', () => {
  const { MI } = runtime();
  const e = new MI.Engine({ version: 1, objects: [
    { id: 'a', type: 'point', label: 'Alpha' },
    { id: 'b', type: 'point', name: 'b', label: 'Beta' },
    { id: 'c', type: 'point', name: 'Custom', label: 'Old' }
  ] });
  assert.equal(e.get('a').name, 'Alpha'); assert.equal(e.get('b').name, 'Beta'); assert.equal(e.get('c').name, 'Custom');
  assert.equal(e.get('a').showLabel, true);
  e.update('a', { name: 'a' });
  const loaded = new MI.Engine(e.toJSON());
  assert.equal(loaded.get('a').name, 'a'); assert.equal(loaded.get('a').label, 'Alpha');
  assert.equal(loaded.toJSON().version, 2);
});
test('opaque root, object, style and presentation fields survive document roundtrips', () => {
  const { MI } = runtime();
  const input = { version: 1, custom: { revision: 3 }, meta: { source: 'legacy' },
    presentation: { showGrid: true, extension: { note: 'preserve' } },
    objects: [{ id: 'a', type: 'point', extra: { data: [1, 2] }, style: { extension: 'style' } }] };
  const e = new MI.Engine(input); const result = new MI.Engine(e.toJSON()).toJSON();
  assert.deepEqual(plain(result.custom), input.custom);
  assert.deepEqual(plain(result.objects[0].extra), input.objects[0].extra);
  assert.equal(result.objects[0].style.extension, 'style');
  assert.deepEqual(plain(result.presentation.extension), input.presentation.extension);
});
test('null label offsets stay null, zero remains explicit, legacy pixel offsets render and roundtrip', () => {
  const { MI } = runtime();
  const e = new MI.Engine({ objects: [
    { id: 'a', type: 'point', showLabel: true, labelDx: 8, labelDy: -8, labelOffsetX: null, labelOffsetY: null },
    { id: 'b', type: 'point', showLabel: true, labelDx: 8, labelDy: -8, labelOffsetX: 0, labelOffsetY: 0 }
  ] });
  const r = e.renderer, a = e.get('a'), b = e.get('b');
  assert.equal(a.labelOffsetX, null); assert.equal(b.labelOffsetX, 0);
  const label = o => r.renderLabel(o, o.name, 8, -8);
  assert.match(label(a), new RegExp('x="' + (r.mapX(0) + 8) + '"'));
  assert.match(label(b), new RegExp('x="' + r.mapX(0) + '"'));
  e.update('a', { name: 'Changed' });
  assert.equal(e.get('a').labelOffsetX, null);
  const reloaded = new MI.Engine(e.toJSON());
  assert.equal(reloaded.get('a').labelOffsetX, null);
  assert.equal(reloaded.get('b').labelOffsetX, 0);
  assert.equal(reloaded.renderSVG(), e.renderSVG());
});
test('default label offsets and explicit mathematical offsets preserve position across export/import and zoom', () => {
  const { MI } = runtime();
  const e = new MI.Engine({ objects: [{ id: 'a', type: 'point', showLabel: true },
    { id: 'b', type: 'line', showLabel: true, labelOffsetX: .5, labelOffsetY: .25 }] });
  assert.equal(e.get('a').labelDx, 8); assert.equal(e.get('a').labelDy, -8);
  const reloaded = new MI.Engine(e.toJSON());
  assert.equal(reloaded.renderSVG(), e.renderSVG());
  for (const engine of [e, reloaded]) engine.renderer.setBounds({ xMin: -2, xMax: 2, yMin: -2, yMax: 2 });
  assert.equal(reloaded.renderSVG(), e.renderSVG());
});
test('presentation is exported explicitly and restored atomically, transient state is excluded', () => {
  const { MI } = runtime(); const e = new MI.Engine(fixture('geometry.json'));
  e.renderer.showGrid = true; e.renderer.showYAxis = false; e.renderer.showOrigin = false;
  e.renderer.setBounds({ xMin: -2, xMax: 2, yMin: -1, yMax: 1 });
  e.renderer.preview = { type: 'line', start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
  const data = e.toJSON();
  assert.equal(data.presentation.showGrid, true); assert.equal(data.presentation.preview, undefined);
  const loaded = new MI.Engine(data);
  assert.equal(loaded.renderer.showYAxis, false); assert.equal(loaded.renderer.showOrigin, false);
  assert.deepEqual(plain(loaded.renderer.bounds), plain(e.renderer.bounds));
  const before = plain(loaded.toJSON());
  for (const presentation of [ { bounds: { xMin: 0, xMax: 0, yMin: 0, yMax: 1 } }, { showGrid: 'yes' }, { coordinateSystem: 'polar' }, { showGrid: true, axisStep: 1e-20 }, [] ]) {
    assert.throws(() => loaded.load({ ...data, meta: { title: 'wrong' }, presentation }));
    assert.deepEqual(plain(loaded.toJSON()), before);
  }
});
test('standalone engine retains explicit grid step and rejects unrenderable presentation before commit', () => {
  const { MI } = runtime();
  const e = new MI.Engine(null, { showGrid: true, axisStep: .5 });
  const saved = plain(e.toJSON());
  const reloaded = new MI.Engine(saved);
  assert.equal(reloaded.renderer.axisStep, .5);
  assert.equal(reloaded.renderSVG(), e.renderSVG());
  assert.throws(() => e.load({ objects: [], presentation: { showGrid: true, bounds: { xMin: -1e8, xMax: 1e8, yMin: -1, yMax: 1 }, axisStep: 1 } }));
  assert.deepEqual(plain(e.toJSON()), saved);
});
test('numeric legacy coordinates and IDs remain compatible, and next-ID generation remains safe', () => {
  const { MI } = runtime();
  const e = new MI.Engine({ objects: [{ id: 42, type: 'point', x: '2.5', y: '-1' }, { id: 'point-' + '9'.repeat(320), type: 'point' }] });
  assert.equal(e.get('42').x, 2.5); assert.equal(e.get('42').y, -1);
  assert.throws(() => e.add({ id: 42, type: 'point' }), /Object-id bestaat al/);
  assert.notEqual(e.add({ type: 'point' }).id, 'point-Infinity');
  const boundary = new MI.Engine({ objects: [{ id: 'point-' + (Number.MAX_SAFE_INTEGER - 2), type: 'point' }] });
  const ids = Array.from({ length: 4 }, () => boundary.add({ type: 'point' }).id);
  assert.equal(new Set(ids).size, 4);
  assert.ok(ids.every(id => Number.isSafeInteger(Number(id.split('-')[1]))));
});
test('standalone model import is atomic, presentation extensions are inert and input data is detached', () => {
  const { MI } = runtime();
  const input = { presentation: { width: -1, bounds: { xMin: -5, xMax: 5, yMin: -3, yMax: 3, note: 'keep' } },
    objects: [{ id: 0, type: 'point', label: 0, style: { extension: { note: 'original' } } }] };
  const e = new MI.Engine(input); const before = plain(e.model.toJSON());
  assert.equal(e.get('0').name, '0'); assert.equal(e.renderer.width, 800);
  input.objects[0].style.extension.note = 'changed';
  assert.equal(e.get('0').style.extension.note, 'original');
  assert.throws(() => e.model.load({ objects: [], presentation: { bounds: { xMin: 0, xMax: 0, yMin: 0, yMax: 1 } } }));
  assert.deepEqual(plain(e.model.toJSON()), before);
  e.renderer.setBounds({ xMin: -4, xMax: 4, yMin: -2, yMax: 2 });
  assert.equal(e.toJSON().presentation.bounds.note, 'keep');
});
