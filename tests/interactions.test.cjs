const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');
function editor() {
  const nodes = new Map(), windowEvents = {}, ready = [];
  const make = id => {
    if (!nodes.has(id)) nodes.set(id, { value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, events: {},
      classList: { add() {}, remove() {}, toggle() {} }, addEventListener(name, fn) { (this.events[name] ||= []).push(fn); },
      querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ left: 0, top: 0 }) });
    return nodes.get(id);
  };
  const svg = { getScreenCTM: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, inverse() { return this; } }) };
  make('canvas').querySelector = selector => selector === 'svg' ? svg : null;
  const document = { readyState: 'loading', getElementById: make, querySelector: selector => selector === '#canvas svg' ? svg : null,
    querySelectorAll: () => [], addEventListener(name, fn) { if (name === 'DOMContentLoaded') ready.push(fn); } };
  const { MI } = runtime(['model.js', 'renderer.js', 'index.js', 'editor-startup.js', 'editor-adaptive-grid.js', 'editor.js'], {
    document, localStorage: { getItem: () => null }, CSS: { escape: x => x },
    DOMPoint: class { constructor(x, y) { this.x = x; this.y = y; } matrixTransform() { return this; } },
    addEventListener(name, fn) { (windowEvents[name] ||= []).push(fn); }
  });
  ready.forEach(fn => fn({ pointerId: 1 }));
  const e = MI.activeEngine;
  const call = (name, value) => (windowEvents[name] || []).forEach(fn => fn(value));
  const tool = value => make('toolGrid').events.click.forEach(fn => fn({ target: { closest: () => ({ dataset: { tool: value } }) } }));
  const down = (x, y) => make('canvasWrap').events.pointerdown.forEach(fn => fn({ pointerId: 1, button: 0, clientX: e.renderer.mapX(x), clientY: e.renderer.mapY(y), preventDefault() {} }));
  const move = (x, y) => call('pointermove', { pointerId: 1, clientX: e.renderer.mapX(x), clientY: e.renderer.mapY(y) });
  const key = value => call('keydown', { key: value, preventDefault() {} });
  return { e, tool, down, move, key, up: () => call('pointerup', { pointerId: 1 }) };
}
test('keyboard length and radius without another mouse sample retain valid preview and exact commit', () => {
  for (const shape of ['line', 'circle']) {
    const { e, tool, down, key, up } = editor();
    tool(shape); down(0, 0); key('1');
    assert.equal(e.renderer.preview.end.x, 1); assert.equal(e.renderer.preview.end.y, 0);
    const end = plain(e.renderer.preview.end); up();
    const saved = e.model.objects[0];
    if (shape === 'line') { assert.equal(saved.x2, end.x); assert.equal(saved.y2, end.y); }
    else assert.equal(saved.r, 1);
    assert.equal(e.renderer.preview, null);
  }
});
test('keyboard edits use the last valid pointer and Enter commits the displayed result', () => {
  const { e, tool, down, move, key } = editor();
  tool('line'); down(0, 0); move(0, 2); key('1'); key('2'); key('Backspace');
  assert.ok(Math.abs(e.renderer.preview.end.x) < 1e-10); assert.equal(e.renderer.preview.end.y, 1);
  key('Enter'); assert.equal(e.model.objects.length, 1); assert.equal(e.model.objects[0].y2, 1);
});
test('rejected short shapes clear previews, typed measurement and do not poison the next drawing', () => {
  for (const shape of ['line', 'circle']) {
    const { e, tool, down, move, key, up } = editor();
    tool(shape); down(0, 0); move(.01, 0); up();
    assert.equal(e.model.objects.length, 0); assert.equal(e.renderer.preview, null);
    down(0, 0); key('0'); key('.'); key('0'); key('1'); up();
    assert.equal(e.model.objects.length, 0); assert.equal(e.renderer.preview, null);
    down(0, 0); move(2, 0); up();
    const saved = e.model.objects[0]; assert.equal(shape === 'line' ? saved.x2 : saved.r, 2);
  }
});
test('invalid pointer samples do not replace the last valid mathematical direction', () => {
  const { e, tool, down, move, key, up } = editor();
  tool('line'); down(0, 0); move(0, 2); move(NaN, 0); key('1');
  assert.equal(e.renderer.preview.end.y, 1); assert.ok(Number.isFinite(e.renderer.preview.end.x));
  up(); assert.equal(e.model.objects[0].y2, 1);
});
