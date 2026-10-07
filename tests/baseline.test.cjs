const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runtime, fixture, plain } = require('./helpers.cjs');
test('supported geometry, metadata, styles and explicit label offsets survive JSON roundtrip', () => {
  const { MI } = runtime();
  const engine = new MI.Engine(fixture('geometry.json'));
  assert.deepEqual(plain(new MI.Engine(JSON.parse(engine.toJSONString())).toJSON()), plain(engine.toJSON()));
  assert.equal(engine.get('A').style.radius, 5);
  assert.equal(engine.get('AB').style.dash, '4 2');
  assert.equal(engine.get('A').labelOffsetX, 0.2);
});
test('representative exported SVG matches the pre-fix fixture', () => {
  const { MI } = runtime();
  const engine = new MI.Engine(fixture('geometry.json'), { width: 800, padding: 20, showGrid: true });
  assert.equal(engine.renderSVG(), fs.readFileSync(path.join(__dirname, 'fixtures', 'geometry.svg'), 'utf8'));
});
test('equal scales, upward mathematical y and exact circle radius', () => {
  const { MI } = runtime();
  for (const bounds of [{ xMin: -5, xMax: 5, yMin: -3, yMax: 3 }, { xMin: 1, xMax: 4, yMin: -10, yMax: 20 }]) {
    const r = new MI.SvgRenderer({ width: 1000, padding: 30, bounds });
    assert.ok(Math.abs((r.mapX(1) - r.mapX(0)) - (r.mapY(0) - r.mapY(1))) < 1e-10);
    assert.ok(r.mapY(1) < r.mapY(0));
    const svg = r.renderObject(new MI.IllustrationModel(fixture('geometry.json')).get('c'));
    assert.ok(Math.abs(Number(svg.match(/ r="([^"]+)"/)[1]) - 2 * r.scale()) < 1e-6);
  }
});
test('hidden objects are excluded from hit testing and engine.move translates a segment rigidly', () => {
  const { MI } = runtime();
  const e = new MI.Engine(fixture('geometry.json'));
  e.update('A', { visible: false });
  assert.notEqual(e.selectAt(-2, 1, 0.01)?.object.id, 'A');
  const before = e.get('AB'); const dx = before.x2 - before.x1, dy = before.y2 - before.y1;
  e.move('AB', 3, 4);
  assert.equal(e.get('AB').x2 - e.get('AB').x1, dx);
  assert.equal(e.get('AB').y2 - e.get('AB').y1, dy);
});
test('adaptive grid follows the existing 1-2-5 ladder and minimum 0.1', () => {
  const { MI } = runtime(['model.js', 'renderer.js', 'index.js', 'editor-adaptive-grid.js']);
  for (const [scale, step] of [[7, 10], [14, 5], [35, 2], [70, 1], [140, .5], [350, .2], [700, .1], [1400, .1]]) {
    assert.equal(MI.adaptiveGridStep({ scale: () => scale }), step);
  }
});
test('origin remains visible with only one axis enabled by the core renderer', () => {
  const { MI } = runtime();
  const r = new MI.SvgRenderer({ showYAxis: false });
  assert.match(r.renderAxes(), />0<\/text>/);
  r.showOrigin = false;
  assert.doesNotMatch(r.renderAxes(), />0<\/text>/);
});
test('segment/segment, segment/circle and circle/circle intersections stay available', () => {
  const { MI } = runtime(['model.js', 'renderer.js', 'index.js', 'editor-enhancements.js']);
  const e = new MI.Engine({ objects: [
    { id: 'h', type: 'line', x1: -3, y1: 0, x2: 3, y2: 0 },
    { id: 'v', type: 'line', x1: 0, y1: -3, x2: 0, y2: 3 },
    { id: 'a', type: 'circle', cx: 0, cy: 0, r: 2 },
    { id: 'b', type: 'circle', cx: 2, cy: 0, r: 2 }
  ] });
  const candidates = MI.getSnapCandidates(e);
  assert.ok(candidates.some(p => p.kind === 'line-line-intersection' && p.x === 0 && p.y === 0));
  assert.ok(candidates.some(p => p.kind === 'line-circle-intersection' && p.x === -2 && p.y === 0));
  assert.ok(candidates.some(p => p.kind === 'circle-circle-intersection' && Math.abs(p.x - 1) < 1e-12 && Math.abs(p.y - Math.sqrt(3)) < 1e-12));
});
