const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');

test('get/all/export and input objects are detached; the public object view is deeply immutable', () => {
  const { MI } = runtime(); const input = { id: 'p', type: 'point', x: 1, y: 2, style: { radius: 7, extension: { a: 1 } } };
  const e = new MI.Engine(); e.add(input); const before = plain(e.toJSON());
  input.style.extension.a = 9; e.get('p').x = 9; e.get('p').style.extension.a = 9; e.model.all()[0].x = 9; e.toJSON().objects[0].x = 9;
  assert.deepEqual(plain(e.toJSON()), before);
  assert.ok(Object.isFrozen(e.model.objects)); assert.ok(Object.isFrozen(e.model.objects[0].style.extension));
  assert.throws(() => e.model.objects.push(input));
});

test('partial style patches retain radius/dash/opacity and merge nested extension fields', () => {
  const { MI } = runtime(); const e = new MI.Engine();
  e.add({ id: 'p', type: 'point', style: { radius: 7, dash: '4 2', opacity: .4, extension: { first: 1, second: 2 } } });
  e.update('p', { style: { stroke: '#abc', extension: { first: 3 } } });
  const style = plain(e.get('p').style);
  assert.equal(style.radius, 7); assert.equal(style.dash, '4 2'); assert.equal(style.opacity, .4);
  assert.deepEqual(style.extension, { first: 3, second: 2 });
  e.update('p', { style: { opacity: 0, strokeWidth: 0 } }); assert.equal(e.get('p').style.opacity, 0);
});

test('invalid add/update/import reject atomically instead of normalizing invalid numbers', () => {
  const { MI } = runtime(); const e = new MI.Engine({ objects: [{ id: 'p', type: 'point', x: 1, y: 2 }] });
  for (const patch of [{ x: NaN }, { y: Infinity }, { style: { opacity: -1 } }, { style: { opacity: 1.1 } }, { style: { strokeWidth: -1 } }, { style: { strokeWidth: NaN } }, { style: { radius: 0 } }, { style: { fontSize: -1 } }, { style: [] }, { id: 'other' }, { type: 'line' }]) {
    const before = plain(e.toJSON()); assert.throws(() => e.update('p', patch), JSON.stringify(patch)); assert.deepEqual(plain(e.toJSON()), before);
  }
  const before = plain(e.toJSON()); assert.throws(() => e.add({ type: 'circle', r: -1 })); assert.deepEqual(plain(e.toJSON()), before);
  assert.throws(() => e.load({ objects: [{ id: 'bad', type: 'point', style: { opacity: Infinity } }] })); assert.deepEqual(plain(e.toJSON()), before);
  assert.equal(e.add({ type: 'point', x: '2.5' }).id, 'point-1');
});

test('screen selection uses constant CSS tolerance for point/segment under zoom, responsive and affine transforms', () => {
  const { MI } = runtime();
  for (const span of [2, 10, 100]) for (const matrix of [{ a: 1, d: 1 }, { a: .4, d: .4 }, { a: 0, b: .5, c: -.3, d: 0 }]) {
    const e = new MI.Engine({ objects: [{ id: 'p', type: 'point', x: 0, y: 0 }] }, { bounds: { xMin: -span, xMax: span, yMin: -span, yMax: span } });
    const transform = new MI.CoordinateTransform(e.renderer, matrix), screen = transform.mathToScreen({ x: 0, y: 0 });
    const near = transform.screenToMath({ x: screen.x + 7, y: screen.y });
    const far = transform.screenToMath({ x: screen.x + 9, y: screen.y });
    assert.equal(e.selectAt(near.x, near.y, { transform, tolerancePx: 8 })?.object.id, 'p');
    assert.equal(e.selectAt(far.x, far.y, { transform, tolerancePx: 8 }), null);
    e.remove('p'); e.add({ id: 'line', type: 'line', x1: -span / 2, y1: 0, x2: span / 2, y2: 0 });
    const a = transform.mathToScreen({ x: -1, y: 0 }), b = transform.mathToScreen({ x: 1, y: 0 }), length = Math.hypot(b.x - a.x, b.y - a.y);
    for (const pixels of [7, 9]) {
      const p = transform.screenToMath({ x: screen.x - (b.y - a.y) / length * pixels, y: screen.y + (b.x - a.x) / length * pixels });
      assert.equal(e.selectAt(p.x, p.y, { transform, tolerancePx: 8 })?.object.id || null, pixels === 7 ? 'line' : null);
    }
  }
});

test('affine circle outline tolerance is measured against the transformed ellipse', () => {
  const { MI } = runtime(); const e = new MI.Engine({ objects: [{ id: 'c', type: 'circle', cx: 0, cy: 0, r: 1 }] });
  const transform = new MI.CoordinateTransform(e.renderer, { a: .3, b: .1, c: .5, d: 1 });
  const angle = .7, outline = transform.mathToScreen({ x: Math.cos(angle), y: Math.sin(angle) });
  const next = transform.mathToScreen({ x: Math.cos(angle + .00001), y: Math.sin(angle + .00001) });
  let nx = next.y - outline.y, ny = outline.x - next.x; const length = Math.hypot(nx, ny); nx /= length; ny /= length;
  const center = transform.mathToScreen({ x: 0, y: 0 }); if (nx * (outline.x - center.x) + ny * (outline.y - center.y) < 0) { nx = -nx; ny = -ny; }
  for (const pixels of [7, 8, 9]) { const p = transform.screenToMath({ x: outline.x + nx * pixels, y: outline.y + ny * pixels }); assert.equal(e.selectAt(p.x, p.y, { transform, tolerancePx: 8 })?.object.id || null, pixels <= 8 ? 'c' : null); }
});

test('circle center and outline select, hidden shapes never select, ties use painting order; numeric legacy API remains stable', () => {
  const { MI } = runtime(); const e = new MI.Engine({ objects: [{ id: 'a', type: 'circle', cx: 0, cy: 0, r: 1 }, { id: 'b', type: 'circle', cx: 0, cy: 0, r: 1 }] });
  const options = { transform: new MI.CoordinateTransform(e.renderer), tolerancePx: 8 };
  assert.equal(e.selectAt(0, 0, options)?.object.id, 'b'); assert.equal(e.selectAt(1, 0, options)?.object.id, 'b');
  e.update('b', { visible: false }); assert.equal(e.selectAt(0, 0, options)?.object.id, 'a');
  assert.equal(e.selectAt(1, 0, .18)?.object.id, 'a'); assert.equal(e.selectAt(0, 0, .18), null);
  e.remove('a'); e.add({ id: 'line', type: 'line', x1: -1, y1: 0, x2: 1, y2: 0 });
  const p = options.transform.screenToMath({ ...options.transform.mathToScreen({ x: 0, y: 0 }), y: options.transform.mathToScreen({ x: 0, y: 0 }).y + 7 });
  assert.equal(e.selectAt(p.x, p.y, options)?.object.id, 'line');
});
