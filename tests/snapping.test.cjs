const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');
const files = ['model.js', 'renderer.js', 'index.js', 'editor-enhancements.js', 'snap-indicator.js'];
function setup(objects = [], options = {}) {
  const { MI } = runtime(files);
  const engine = new MI.Engine({ objects }, { width: 1000, bounds: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, ...options });
  return { MI, engine };
}
function close(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`); }
test('direct engine add/update never implicitly snap coordinates with all feature layers loaded', () => {
  const { engine: e } = setup([{ id: 'p', type: 'point', x: 1.05, y: 0 }], { showGrid: true });
  const l = e.add({ type: 'line', x1: 0, y1: 0, x2: 1, y2: 0 });
  assert.equal(l.x2, 1);
  assert.equal(e.update(l.id, { x2: 1.02, y2: 0 }).x2, 1.02);
});
test('point and grid snapping have explicit results and visibility/grid opt-out', () => {
  const { MI, engine: e } = setup([{ id: 'p', type: 'point', x: 1.05, y: 0 }], { showGrid: true });
  const point = MI.SnapService.resolve(e, { x: 1.02, y: 0 });
  assert.equal(point.kind, 'point'); assert.deepEqual(plain(point.point), { x: 1.05, y: 0 });
  const grid = MI.SnapService.resolve(e, { x: 2.04, y: .03 });
  assert.equal(grid.kind, 'grid'); assert.deepEqual(plain(grid.point), { x: 2, y: 0 });
  e.renderer.showGrid = false; assert.equal(MI.SnapService.resolve(e, { x: 2.04, y: .03 }).snapped, false);
});
test('segment/segment intersection is snapped, not the extension of a segment', () => {
  const { MI, engine: e } = setup([
    { id: 'h', type: 'line', x1: -2, y1: 0, x2: 2, y2: 0 },
    { id: 'v', type: 'line', x1: 0, y1: -2, x2: 0, y2: 2 }
  ]);
  const result = MI.SnapService.resolve(e, { x: .02, y: .02 });
  assert.equal(result.kind, 'line-line-intersection'); assert.deepEqual(plain(result.point), { x: 0, y: 0 });
  assert.equal(MI.SnapService.resolve(e, { x: 3, y: 0 }).snapped, false);
});
test('segment/circle intersection, tangent and finite segment boundary', () => {
  const { MI, engine: e } = setup([
    { id: 'l', type: 'line', x1: -3, y1: 0, x2: 3, y2: 0 },
    { id: 'c', type: 'circle', cx: 0, cy: 0, r: 2 }
  ]);
  assert.equal(MI.SnapService.resolve(e, { x: -2.02, y: .01 }).kind, 'line-circle-intersection');
  e.update('l', { y1: 2, y2: 2 });
  assert.equal(MI.SnapService.resolve(e, { x: .02, y: 2.01 }).kind, 'line-circle-intersection');
});
test('circle/circle intersections and coincident circles', () => {
  const { MI, engine: e } = setup([{ id: 'a', type: 'circle', cx: 0, cy: 0, r: 2 }, { id: 'b', type: 'circle', cx: 2, cy: 0, r: 2 }]);
  const result = MI.SnapService.resolve(e, { x: 1.01, y: Math.sqrt(3) + .01 });
  assert.equal(result.kind, 'circle-circle-intersection'); close(result.point.x, 1); close(result.point.y, Math.sqrt(3));
  e.update('b', { cx: 0 });
  assert.ok(!MI.getSnapCandidates(e).some(p => p.kind === 'circle-circle-intersection'));
});
test('visibility/excludeId remove both anchors and dependent intersection candidates', () => {
  const { MI, engine: e } = setup([{ id: 'h', type: 'line', x1: -2, y1: 0, x2: 2, y2: 0 }, { id: 'v', type: 'line', x1: 0, y1: -2, x2: 0, y2: 2 }]);
  assert.equal(MI.SnapService.resolve(e, { x: 0, y: 0 }, { excludeId: 'h' }).snapped, false);
  e.update('v', { visible: false }); assert.equal(MI.SnapService.resolve(e, { x: 0, y: 0 }).snapped, false);
});
test('priority is point > intersection > endpoint > center > grid, independent of object order', () => {
  const objects = [{ id: 'z', type: 'point', x: .05, y: 0 }, { id: 'a', type: 'point', x: -.05, y: 0 }, { id: 'c', type: 'circle', cx: 0, cy: 0, r: 2 }];
  for (const values of [objects, [...objects].reverse()]) {
    const { MI, engine: e } = setup(values, { showGrid: true });
    const result = MI.SnapService.resolve(e, { x: 0, y: 0 });
    assert.equal(result.kind, 'point'); assert.deepEqual(plain(result.ids), ['a']);
  }
});
test('screen tolerance is 12 CSS pixels under responsive scale, rotation and viewport zoom', () => {
  const { MI, engine: e } = setup([{ id: 'p', type: 'point', x: 0, y: 0 }]);
  for (const matrix of [{ a: .5, d: .5, b: 0, c: 0, e: 50, f: 30 }, { a: 0, b: .5, c: -.5, d: 0, e: 50, f: 30 }]) {
    const transform = new MI.CoordinateTransform(e.renderer, matrix);
    assert.equal(MI.SnapService.resolve(e, { x: .23, y: 0 }, { transform }).snapped, true);
    assert.equal(MI.SnapService.resolve(e, { x: .25, y: 0 }, { transform }).snapped, false);
    const screen = transform.mathToScreen({ x: 2, y: -1 }); const back = transform.screenToMath(screen);
    close(back.x, 2); close(back.y, -1);
  }
  e.renderer.setBounds({ xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 });
  assert.equal(MI.SnapService.resolve(e, { x: .061, y: 0 }).snapped, false);
});
test('each priority tier wins over a closer lower tier; nearest distance wins within a tier', () => {
  const cases = [
    [[{ id: 'h', type: 'line', x1: -2, y1: 0, x2: 2, y2: 0 }, { id: 'v', type: 'line', x1: 0, y1: -2, x2: 0, y2: 2 }, { id: 's', type: 'line', x1: .05, y1: .05, x2: .5, y2: .5 }], { x: .05, y: .05 }, 'line-line-intersection'],
    [[{ id: 's', type: 'line', x1: .05, y1: 0, x2: .5, y2: .5 }, { id: 'c', type: 'circle', cx: 0, cy: 0, r: 2 }], { x: 0, y: 0 }, 'line-endpoint'],
    [[{ id: 'c', type: 'circle', cx: .05, cy: 0, r: 2 }], { x: 0, y: 0 }, 'circle-center']
  ];
  for (const [objects, raw, kind] of cases) {
    const { MI, engine: e } = setup(objects, { showGrid: true });
    assert.equal(MI.SnapService.resolve(e, raw).kind, kind);
  }
  const { MI, engine: e } = setup([{ id: 'a', type: 'point', x: .1, y: 0 }, { id: 'z', type: 'point', x: .02, y: 0 }]);
  assert.deepEqual(plain(MI.SnapService.resolve(e, { x: 0, y: 0 }).ids), ['z']);
});
test('screen transforms reject invalid matrices and maintain tolerance under anisotropic scaling', () => {
  const { MI, engine: e } = setup([{ id: 'p', type: 'point', x: 0, y: 0 }]);
  for (const matrix of [{ a: 0, d: 0 }, { b: NaN }, { e: Infinity }]) assert.throws(() => new MI.CoordinateTransform(e.renderer, matrix));
  const transform = new MI.CoordinateTransform(e.renderer, { a: .5, d: 2, e: 100, f: 30 });
  assert.equal(MI.SnapService.resolve(e, { x: .23, y: 0 }, { transform }).snapped, true);
  assert.equal(MI.SnapService.resolve(e, { x: 0, y: .061 }, { transform }).snapped, false);
  const rotated = new MI.CoordinateTransform(e.renderer, { a: 0, b: .5, c: -.5, d: 0 });
  const delta = rotated.screenDelta(10, 0); close(delta.x, 0); close(delta.y, .2);
});
test('draw preview and committed coordinates reuse the same result for line/circle', () => {
  const { MI, engine: e } = setup([{ id: 'p', type: 'point', x: 2, y: 1 }]);
  for (const shape of ['line', 'circle']) {
    const draw = MI.InteractionResolver.draw(e, shape, { x: 0, y: 0 }, { x: 2.03, y: 1.01 });
    assert.deepEqual(plain(draw.preview.end), plain(draw.result.point));
    const saved = e.add(draw.object);
    if (shape === 'line') { close(saved.x2, draw.preview.end.x); close(saved.y2, draw.preview.end.y); }
    else close(saved.r, Math.hypot(draw.preview.end.x, draw.preview.end.y));
    e.remove(saved.id);
  }
});
test('exact length 1 near candidate 1.05 stays 1; exact radius wins over snapping', () => {
  const { MI, engine: e } = setup([{ id: 'p', type: 'point', x: 1.05, y: 0 }], { showGrid: true });
  for (const shape of ['line', 'circle']) {
    const draw = MI.InteractionResolver.draw(e, shape, { x: 0, y: 0 }, { x: 1.02, y: 0 }, { exactDistance: 1 });
    assert.equal(draw.result.snapped, false); close(draw.preview.end.x, 1);
    const saved = e.add(draw.object);
    if (shape === 'line') assert.equal(Math.hypot(saved.x2 - saved.x1, saved.y2 - saved.y1), 1);
    else assert.equal(saved.r, 1);
    e.remove(saved.id);
  }
});
test('rigid line translation applies one correction to both endpoints', () => {
  const { MI, engine: e } = setup([{ id: 'p', type: 'point', x: 1.1, y: 0 }, { id: 'l', type: 'line', x1: 0, y1: 0, x2: 1, y2: 0 }]);
  const moved = MI.InteractionResolver.translateLine(e, e.get('l'), { x: .05, y: 0 });
  const saved = e.update('l', moved.patch);
  close(saved.x2, 1.1); close(saved.x2 - saved.x1, 1); close(saved.y2 - saved.y1, 0);
});
test('individual endpoint snaps independently to grid, excludes its own line, and preview patch is committed unchanged', () => {
  const { MI, engine: e } = setup([{ id: 'l', type: 'line', x1: .3, y1: .3, x2: 1.3, y2: .3 }], { showGrid: true });
  const original = e.get('l');
  const moved = MI.InteractionResolver.endpoint(e, original, 'end', { x: 2.04, y: .02 });
  assert.equal(moved.result.kind, 'grid'); assert.deepEqual(plain(moved.patch), { x2: 2, y2: 0 });
  const saved = e.update('l', moved.patch);
  assert.equal(saved.x1, .3); assert.equal(saved.y1, .3); assert.equal(saved.x2, moved.result.point.x);
});
test('exact distance without pointer displacement chooses +x and rejects nonfinite pointer samples', () => {
  const { MI, engine: e } = setup();
  const draw = MI.InteractionResolver.draw(e, 'circle', { x: 2, y: 3 }, { x: 2, y: 3 }, { exactDistance: 1 });
  assert.deepEqual(plain(draw.preview.end), { x: 3, y: 3 }); assert.equal(draw.object.r, 1);
  assert.throws(() => MI.SnapService.resolve(e, { x: NaN, y: 0 }));
});
