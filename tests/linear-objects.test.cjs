const test = require('node:test'); const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');
test('linear tools remain classified when a cached model lacks the optional family export', () => {
  const { MI, context } = runtime(); delete MI.LINEAR_OBJECT_TYPES;
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'linear-geometry.js'), 'utf8'), context);
  for (const type of ['line', 'straight', 'ray', 'vector']) assert.equal(MI.LinearGeometry.isLinear({ type }), true, type);
  assert.equal(MI.LinearGeometry.isLinear({ type: 'circle' }), false);
});
for (const type of ['straight', 'ray', 'vector']) test(`${type}: roundtrip, rigid translation, endpoint edit and exact drawing`, () => {
  const { MI } = runtime(); const e = new MI.Engine(); e.add({ id: 'a', type, x1: 0, y1: 0, x2: 1, y2: 0, showLabel: true, name: type });
  assert.deepEqual(plain(new MI.Engine(e.toJSON()).toJSON()), plain(e.toJSON()));
  e.move('a', 2, 3); assert.equal(e.get('a').x2, 3); assert.equal(e.get('a').y2, 3);
  const resolved = MI.InteractionResolver.draw(e, type, { x: 0, y: 0 }, { x: 1.05, y: 0 }, { exactDistance: 1 });
  assert.equal(resolved.object.type, type); assert.equal(resolved.object.x2, 1);
  const endpoint = MI.InteractionResolver.endpoint(e, e.get('a'), 'end', { x: 4, y: 4 }); e.update('a', endpoint.patch); assert.equal(e.get('a').x1, 2);
});
test('straight/ray are clipped to the mathematical viewport and direction arrows have correct semantics', () => {
  const { MI } = runtime(); const e = new MI.Engine({ objects: [{ id: 's', type: 'straight', x1: 0, y1: 0, x2: 1, y2: 0 }, { id: 'r', type: 'ray', x1: 0, y1: 1, x2: 1, y2: 1 }, { id: 'v', type: 'vector', x1: 0, y1: -1, x2: 1, y2: -1 }] });
  const b = e.renderer.bounds, clip = MI.LinearGeometry.clip;
  assert.equal(clip(e.get('s'), b).start.x, b.xMin); assert.equal(clip(e.get('s'), b).end.x, b.xMax);
  assert.equal(clip(e.get('r'), b).start.x, 0); assert.equal(clip(e.get('r'), b).end.x, b.xMax);
  assert.equal(clip(e.get('v'), b).end.x, 1);
  const svg = e.renderSVG(); assert.equal((svg.match(/data-direction-arrow/g) || []).length, 4); assert.doesNotMatch(svg, /NaN|Infinity/);
  e.update('v', { x2: 100 }); assert.equal((e.renderer.renderObject(e.get('v')).match(/data-direction-arrow/g) || []).length, 0);
  e.add({ id: 'away', type: 'ray', x1: 10, y1: 0, x2: 11, y2: 0 }); assert.equal(clip(e.get('away'), b), null);
});
test('intersections respect infinite, forward-only and finite domains including circles', () => {
  const { MI } = runtime();
  const e = new MI.Engine({ objects: [{ id: 's', type: 'straight', x1: 0, y1: 0, x2: 1, y2: 0 }, { id: 'v', type: 'vector', x1: 2, y1: -1, x2: 2, y2: 1 }, { id: 'c', type: 'circle', cx: 0, cy: 0, r: 2 }] });
  let candidates = MI.SnapService.candidates(e); assert.ok(candidates.some(c => c.kind === 'line-line-intersection' && c.x === 2));
  assert.ok(candidates.some(c => c.kind === 'line-circle-intersection' && c.x === -2));
  e.remove('s'); e.add({ id: 'r', type: 'ray', x1: 0, y1: 0, x2: 1, y2: 0 }); candidates = MI.SnapService.candidates(e);
  assert.ok(candidates.some(c => c.kind === 'line-circle-intersection' && c.x === 2)); assert.ok(!candidates.some(c => c.kind === 'line-circle-intersection' && c.x === -2 && c.ids.includes('r')));
  assert.ok(!MI.SnapService.candidates(e, 'r').some(c => c.ids.includes('r')));
});
test('selection supports extensions and ray direction, zero vector is valid, zero direction straight/ray reject atomically', () => {
  const { MI } = runtime(); const e = new MI.Engine({ objects: [{ id: 'r', type: 'ray', x1: 0, y1: 0, x2: 1, y2: 0 }] });
  assert.equal(e.selectAt(3, 0, .1)?.object.id, 'r'); assert.equal(e.selectAt(-1, 0, .1), null);
  e.add({ id: 'zero', type: 'vector', x1: 2, y1: 1, x2: 2, y2: 1 }); assert.doesNotMatch(e.renderSVG(), /NaN|Infinity/);
  const before = plain(e.toJSON()); assert.throws(() => e.update('r', { x2: 0 })); assert.deepEqual(plain(e.toJSON()), before);
  assert.throws(() => e.add({ type: 'straight', x1: 1, y1: 1, x2: 1, y2: 1 }));
  assert.throws(() => e.add({ type: 'vector', x1: -1e308, y1: 0, x2: 1e308, y2: 0 }));
});

test('clipping handles vertical/reversed/diagonal rays; degenerate endpoint snapping retains a valid preview/commit', () => {
  const { MI } = runtime(); const b = { xMin: -5, xMax: 5, yMin: -3, yMax: 3 };
  for (const object of [{ type: 'straight', x1: 1, y1: 0, x2: 1, y2: 1 }, { type: 'ray', x1: 0, y1: 0, x2: -1, y2: 0 }, { type: 'straight', x1: 0, y1: 0, x2: 1, y2: 1 }]) {
    const clip = MI.LinearGeometry.clip(object, b);
    for (const p of [clip.start, clip.end]) assert.ok(p.x >= -5 && p.x <= 5 && p.y >= -3 && p.y <= 3);
  }
  const e = new MI.Engine({ objects: [{ id: 'r', type: 'ray', x1: 0, y1: 0, x2: 1, y2: 0 }] }); e.renderer.showGrid = true;
  const resolved = MI.InteractionResolver.endpoint(e, e.get('r'), 'end', { x: 0, y: 0 });
  assert.equal(resolved.result.constraint, 'nonzero-direction'); assert.equal(resolved.patch.x2, 1); e.update('r', resolved.patch);
  assert.equal(e.get('r').x2, resolved.result.point.x);
});
