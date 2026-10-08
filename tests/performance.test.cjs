const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');

test('unchanged geometry reuses candidate construction, including rigid-drag exclusion', () => {
  const { MI } = runtime();
  const e = new MI.Engine({ objects: Array.from({ length: 10 }, (_, i) => ({ id: `l${i}`, type: 'line', x1: -2, y1: -i / 10, x2: 2, y2: i / 10 })) });
  let reads = 0; Object.defineProperty(e.get('l0'), 'x1', { get() { reads++; return -2; }, enumerable: true });
  MI.SnapService.resolve(e, { x: 0, y: 0 }, { excludeId: 'l9' }); const coldReads = reads;
  reads = 0; MI.SnapService.resolve(e, { x: .01, y: 0 }, { excludeId: 'l9' });
  assert.ok(coldReads > reads * 2); assert.equal(reads, 1);
  e.update('l9', { x1: -3 }); reads = 0;
  MI.SnapService.resolve(e, { x: .01, y: 0 }, { excludeId: 'l9' }); assert.equal(reads, 1);
});

test('cached snaps invalidate for geometry, visibility, IDs, add/remove and import, including live get mutation', () => {
  const { MI } = runtime();
  const e = new MI.Engine({ objects: [{ id: 'p', type: 'point', x: 0, y: 0 }, { id: 'l', type: 'line', x1: -2, y1: 0, x2: 2, y2: 0 }] });
  const check = () => {
    const fresh = new MI.Engine(e.toJSON());
    for (const excludeId of [undefined, 'p', 'l']) for (const point of [{ x: 0, y: 0 }, { x: .1, y: .1 }, { x: 1, y: 0 }])
      assert.deepEqual(plain(MI.SnapService.resolve(e, point, { excludeId })), plain(MI.SnapService.resolve(fresh, point, { excludeId })));
  };
  check(); e.update('p', { x: 1 }); check(); e.update('p', { visible: false }); check();
  e.get('p').visible = true; e.get('p').x = .1; check();
  e.get('p').id = 'renamed'; check();
  e.add({ id: 'c', type: 'circle', cx: 0, cy: 0, r: 1 }); check(); e.remove('c'); check();
  e.renderer.showGrid = true; e.renderer.axisStep = .5; check(); e.renderer.setBounds({ xMin: -1, xMax: 1, yMin: -1, yMax: 1 }); check();
  e.load({ objects: [{ id: 'new', type: 'point', x: .1, y: .1 }] }); check();
});

test('candidate and snap result callers cannot corrupt the internal cached geometry', () => {
  const { MI } = runtime(); const e = new MI.Engine({ objects: [{ id: 'p', type: 'point', x: 0, y: 0 }] });
  const candidates = MI.SnapService.candidates(e); candidates[0].x = 99; candidates[0].ids.push('bad'); candidates.length = 0;
  const result = MI.SnapService.resolve(e, { x: 0, y: 0 }); result.ids.push('bad'); result.point.x = 99;
  const next = MI.SnapService.resolve(e, { x: 0, y: 0 }); assert.equal(next.point.x, 0); assert.deepEqual(plain(next.ids), ['p']);
});

function editor() {
  const frames = new Map(); let serial = 0;
  const nodes = new Map(); const node = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', style: {}, dataset: {}, classList: { add() {}, toggle() {} }, addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [], contains: () => true, getBoundingClientRect: () => ({ left: 0, top: 0 }) });
    return nodes.get(id);
  };
  node('canvas').querySelector = () => ({ getScreenCTM: () => ({ a: 1, d: 1, b: 0, c: 0, e: 0, f: 0 }) });
  const { MI } = runtime(['model.js', 'renderer.js', 'index.js', 'editor.js'], {
    document: { getElementById: node, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {} },
    requestAnimationFrame(fn) { frames.set(++serial, fn); return serial; }, cancelAnimationFrame(id) { frames.delete(id); }
  });
  const app = MI.editor, e = app.engine;
  let renders = 0; const original = app.render; app.render = function() { renders++; return original.call(this); };
  const down = (x, y) => app.pointerDown({ pointerId: 1, button: 0, clientX: e.renderer.mapX(x), clientY: e.renderer.mapY(y), preventDefault() {} });
  const move = (x, y) => app.pointerMove({ pointerId: 1, clientX: e.renderer.mapX(x), clientY: e.renderer.mapY(y) });
  return { app, e, frames, down, move, count: () => renders, flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); } };
}

test('pointer bursts render once per frame while the latest resolver result remains synchronous', () => {
  const h = editor(); h.app.setTool('line'); h.down(0, 0); const initial = h.count();
  for (const x of [1, 2, 3]) h.move(x, 1);
  assert.equal(h.count(), initial); assert.equal(h.frames.size, 1); assert.equal(h.e.renderer.preview.end.x, 3);
  h.flush(); assert.equal(h.count(), initial + 1);
  h.app.pointerUp({ pointerId: 1 }); assert.equal(h.e.model.objects[0].x2, 3); assert.equal(h.e.model.objects[0].y2, 1);
});

test('commit/keyboard flush the latest result and cancel/New/dispose cannot resurrect pending rendering', () => {
  for (const action of ['commit', 'cancel', 'newDocument', 'dispose']) {
    const h = editor(); h.app.setTool('line'); h.down(0, 0); h.move(2, 0);
    assert.equal(h.frames.size, 1);
    if (action === 'commit') h.app.keyDown({ key: '1', preventDefault() {} });
    h.app[action](); assert.equal(h.frames.size, 0); const count = h.count(); h.flush(); assert.equal(h.count(), count);
    assert.equal(h.e.model.objects.length, action === 'commit' ? 1 : 0);
    if (action === 'commit') assert.equal(h.e.model.objects[0].x2, 1);
    assert.equal(h.e.renderer.preview, null);
  }
});
