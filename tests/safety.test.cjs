const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { runtime, plain } = require('./helpers.cjs');

test('invalid bounds and raster steps are rejected before rendering', () => {
  const { MI } = runtime();
  const good = { xMin: -5, xMax: 5, yMin: -3, yMax: 3 };
  for (const bounds of [
    { ...good, xMax: -5 }, { ...good, yMax: -4 }, { ...good, xMin: NaN },
    { ...good, xMax: Infinity }, { ...good, xMax: 1e13 }, { ...good, xMax: -5 + 1e-8 }
  ]) assert.throws(() => new MI.SvgRenderer({ bounds }), /viewport/);
  for (const axisStep of [0, -1, NaN, Infinity]) assert.throws(() => new MI.SvgRenderer({ axisStep }), /Rasterstap/);
  for (const options of [{ width: 0 }, { width: Infinity }, { padding: -1 }, { width: 10, padding: 5 }]) {
    assert.throws(() => new MI.SvgRenderer(options), /viewport/i);
  }
});
test('failed setBounds preserves the previous viewport and valid bounds preserve equal scale', () => {
  const { MI } = runtime(); const r = new MI.SvgRenderer(); const before = plain(r.bounds), height = r.height;
  assert.throws(() => r.setBounds({ xMin: 0, xMax: 0, yMin: 0, yMax: 1 }), /viewport/);
  assert.deepEqual(plain(r.bounds), before); assert.equal(r.height, height);
  r.setBounds({ xMin: -10, xMax: 20, yMin: -2, yMax: 8 });
  assert.ok(Math.abs(r.mapX(1) - r.mapX(0) - (r.mapY(0) - r.mapY(1))) < 1e-10);
});
test('post-construction mutations cannot bypass render validation', () => {
  const { MI } = runtime(); const e = new MI.Engine();
  e.renderer.bounds.xMax = NaN; assert.throws(() => e.renderSVG(), /viewport/);
  e.renderer.bounds = { xMin: -5, xMax: 5, yMin: -3, yMax: 3 };
  e.renderer.axisStep = 0; assert.throws(() => e.renderSVG(), /Rasterstap/);
});
test('dense or numerically unsafe ticks fail promptly, including huge shifted coordinates', () => {
  // A regression to an unbounded synchronous loop must fail the test, not hang the runner.
  const child = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const { runtime } = require(${JSON.stringify(path.join(__dirname, 'helpers.cjs'))});
    const { MI } = runtime();
    for (const options of [
      { axisStep: 1e-9 },
      { axisStep: 1e-20, bounds: { xMin: 1e12 - 10, xMax: 1e12, yMin: -1, yMax: 1 } }
    ]) {
      const r = new MI.SvgRenderer({ showGrid: true, ...options });
      assert.throws(() => r.renderGrid(), /Te veel/);
      assert.throws(() => r.renderAxes(), /Te veel/);
    }
  `], { timeout: 3000, encoding: 'utf8', maxBuffer: 1024 * 1024 });
  assert.equal(child.error, undefined, 'isolated render exceeded its safety timeout');
  assert.equal(child.status, 0, child.stderr);
  const { MI } = runtime();
  for (const options of [
    { axisStep: .1, bounds: { xMin: 1e12 - 10, xMax: 1e12, yMin: -1, yMax: 1 } }
  ]) {
    const r = new MI.SvgRenderer({ showGrid: true, ...options });
    if (options.axisStep === .1) {
      const svg = r.render(new MI.IllustrationModel());
      assert.ok((svg.match(/<line /g) || []).length < 1000);
      assert.doesNotMatch(svg, /NaN|Infinity/);
    }
  }
});
test('tick budget is explicit and includes exactly 1000 positions', () => {
  const { MI } = runtime();
  const r = new MI.SvgRenderer({ showGrid: true, showAxes: false, axisStep: 1, bounds: { xMin: 0, xMax: 999, yMin: 0, yMax: 1 } });
  assert.equal((r.renderGrid().match(/<line /g) || []).length, 1002);
  r.bounds.xMax = 1000;
  assert.throws(() => r.renderGrid(), /Te veel/);
});
test('decimal ticks and adaptive wide zooms remain finite and bounded', () => {
  const { MI } = runtime(['model.js', 'renderer.js', 'index.js', 'editor-adaptive-grid.js']);
  for (const span of [2, 10, 1e4, 1e8, 1e12]) {
    const e = new MI.Engine(null, { showGrid: true, bounds: { xMin: -span / 2, xMax: span / 2, yMin: -span / 2, yMax: span / 2 } });
    const svg = e.renderSVG();
    assert.ok((svg.match(/<line /g) || []).length < 1000);
    assert.doesNotMatch(svg, /NaN|Infinity/);
    assert.ok(Number.isFinite(e.renderer.axisStep) && e.renderer.axisStep > 0);
  }
});

function editorRuntime() {
  const nodes = new Map(), ready = [], windowEvents = {};
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, events: {},
      addEventListener(name, fn, options) { (this.events[name] ||= []).push({ fn, capture: options === true || options?.capture, options }); },
      querySelector() { return null; }, querySelectorAll() { return []; }, getBoundingClientRect() { return { left: 0, top: 0 }; }
    });
    return nodes.get(id);
  }
  const matrix = { inverse() { return this; } };
  node('canvas').querySelector = selector => selector === 'svg' ? { getScreenCTM: () => matrix } : null;
  const document = { readyState: 'loading', getElementById: node, querySelectorAll: () => [],
    addEventListener(name, fn) { if (name === 'DOMContentLoaded') ready.push(fn); } };
  const { MI } = runtime(['model.js', 'renderer.js', 'index.js', 'editor-startup.js', 'editor-adaptive-grid.js', 'editor.js'], {
    document, localStorage: { getItem: () => null, removeItem() {} },
    CSS: { escape: x => x }, DOMPoint: class { constructor(x, y) { this.x = x; this.y = y; } matrixTransform() { return this; } },
    addEventListener(name, fn) { (windowEvents[name] ||= []).push(fn); }
  });
  ready.forEach(fn => fn());
  function wheel(deltaY, clientX = 500, clientY = 312) {
    const event = { deltaY, clientX, clientY, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; } };
    for (const handler of [...node('canvasWrap').events.wheel].sort((a, b) => Number(!!b.capture) - Number(!!a.capture))) {
      handler.fn(event); if (event.stopped) break;
    }
    return event;
  }
  return { MI, engine: MI.activeEngine, wheel, node, windowEvents };
}
test('wheel uses tracked engine, clamps crossing step to 700, blocks further zoom and permits zoom-out', () => {
  const { MI, engine: e, wheel, node } = editorRuntime();
  assert.equal(MI.adaptiveGridEngine, e);
  const capture = node('canvasWrap').events.wheel.find(h => h.capture);
  assert.equal(capture.options.passive, false);
  for (let i = 0; i < 30; i++) wheel(-1);
  assert.ok(Math.abs(e.renderer.scale() - 700) < 1e-8);
  assert.equal(e.renderer.axisStep, .1);
  const before = plain(e.renderer.bounds);
  assert.equal(wheel(-1).stopped, true);
  assert.deepEqual(plain(e.renderer.bounds), before);
  wheel(1); assert.ok(e.renderer.scale() < 700);
});
test('cursor anchor, aspect ratio and zero/nonfinite wheel behavior remain stable', () => {
  const { engine: e, wheel } = editorRuntime();
  const r = e.renderer, x = 300, y = 200;
  const anchor = () => ({ x: r.bounds.xMin + (x - r.padding) / r.scale(), y: r.bounds.yMin + (r.height - r.padding - y) / r.scale() });
  const before = anchor(); const aspect = (r.bounds.yMax - r.bounds.yMin) / (r.bounds.xMax - r.bounds.xMin);
  wheel(-1, x, y);
  assert.ok(Math.abs(anchor().x - before.x) < 1e-10 && Math.abs(anchor().y - before.y) < 1e-10);
  assert.ok(Math.abs((r.bounds.yMax - r.bounds.yMin) / (r.bounds.xMax - r.bounds.xMin) - aspect) < 1e-10);
  const bounds = plain(r.bounds);
  for (const delta of [0, NaN, Infinity]) wheel(delta);
  assert.deepEqual(plain(r.bounds), bounds);
});
test('repeated zoom-out stops safely without corrupting viewport or generating an oversized grid', () => {
  const { engine: e, wheel, node } = editorRuntime(); e.renderer.showGrid = true;
  for (let i = 0; i < 250; i++) wheel(1);
  const before = plain(e.renderer.bounds);
  wheel(1); assert.deepEqual(plain(e.renderer.bounds), before);
  assert.match(node('status').textContent, /viewport/);
  assert.doesNotMatch(e.renderSVG(), /NaN|Infinity/);
});
test('pan retains ordinary displacement and rejects an extreme movement atomically', () => {
  const { engine: e, node, windowEvents } = editorRuntime();
  const before = plain(e.renderer.bounds), scale = e.renderer.scale();
  const down = { button: 0, clientX: 500, clientY: 312, preventDefault() {} };
  node('canvasWrap').events.mousedown.forEach(h => h.fn(down));
  windowEvents.mousemove.forEach(fn => fn({ clientX: 594, clientY: 312 }));
  assert.ok(Math.abs(e.renderer.bounds.xMin - (before.xMin - 94 / scale)) < 1e-10);
  const valid = plain(e.renderer.bounds);
  windowEvents.mousemove.forEach(fn => fn({ clientX: 1e20, clientY: 312 }));
  assert.deepEqual(plain(e.renderer.bounds), valid);
  windowEvents.mouseup.forEach(fn => fn());
});
