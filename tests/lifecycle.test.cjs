const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { runtime, plain, root } = require('./helpers.cjs');

test('standalone renderer respects visibility and origin with either axis independently', () => {
  const { MI } = runtime();
  const e = new MI.Engine({ objects: [{ id: 'hidden', type: 'line', visible: false, showLabel: true, x1: 0, y1: 0, x2: 1, y2: 0 }] });
  assert.doesNotMatch(e.renderSVG(), /data-object-id="hidden"/);
  e.renderer.showXAxis = false;
  assert.match(e.renderSVG(), />0<\/text>/);
  e.renderer.showYAxis = false;
  assert.doesNotMatch(e.renderSVG(), />0<\/text>/);
});
test('loading feature modules never installs render-based engine trackers or drag listeners', () => {
  const { MI, context } = runtime(); const render = MI.Engine.prototype.renderSVG, axes = MI.SvgRenderer.prototype.renderAxes;
  let listeners = 0; context.addEventListener = () => listeners++;
  context.document.addEventListener = () => listeners++;
  for (const file of ['editor-adaptive-grid.js', 'editor-label-drag.js', 'editor-enhancements.js', 'snap-indicator.js', 'editor-color.js', 'editor-axis-settings.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  assert.equal(MI.Engine.prototype.renderSVG, render); assert.equal(MI.SvgRenderer.prototype.renderAxes, axes);
  assert.equal(listeners, 0);
});

test('standalone engine construction/render cannot replace an explicit editor compatibility reference', () => {
  const { MI } = runtime(); const owner = new MI.Engine(); MI.activeEngine = owner;
  new MI.Engine().renderSVG(); assert.equal(MI.activeEngine, owner);
});

test('source has one canvas render owner and no alternative feature interaction/engine trackers', () => {
  const files = ['editor.js', 'editor-bootstrap.js', 'editor-adaptive-grid.js', 'editor-axis-settings.js', 'editor-color.js', 'editor-label-drag.js', 'editor-enhancements.js', 'snap-indicator.js'];
  const source = files.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  assert.equal((source.match(/canvas\.innerHTML\s*=/g) || []).length, 1);
  assert.equal((source.match(/"pointerdown"/g) || []).length, 1);
  assert.doesNotMatch(source, /prototype\.renderSVG|prototype\.renderAxes|MutationObserver|installEngineTracker|trackEngine|adaptiveGridEngine|"mousedown"|"mousemove"|"mouseup"/);
  assert.equal((source.match(/MI\.activeEngine\s*=/g) || []).length, 1);
});

// The lifecycle API is exercised without relying on a real DOM parser.
function appRuntime() {
  const { MI, context } = runtime();
  vm.runInContext(fs.readFileSync(path.join(root, 'editor.js'), 'utf8'), context);
  const events = new Map();
  function target() { return { value: '', style: {}, dataset: {}, events: new Map(), classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, fn) { (this.events.get(type) || (this.events.set(type, new Set()), this.events.get(type))).add(fn); },
    removeEventListener(type, fn) { this.events.get(type)?.delete(fn); },
    querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ left: 0, top: 0 }), contains: () => true,
    setPointerCapture(id) { this.capture = id; }, hasPointerCapture(id) { return this.capture === id; }, releasePointerCapture() { this.capture = null; } }; }
  const nodes = new Map(), win = target();
  const doc = { getElementById(id) { if (!nodes.has(id)) nodes.set(id, target()); return nodes.get(id); }, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, activeElement: { tagName: 'BODY' } };
  doc.getElementById('canvas').querySelector = selector => selector === 'svg' ? { getScreenCTM: () => ({ a: .5, d: .5, b: 0, c: 0, e: 0, f: 0 }), querySelector: () => null } : null;
  const engine = new MI.Engine({ objects: [{ id: 'p', type: 'point', x: 0, y: 0, showLabel: true }, { id: 'l', type: 'line', x1: 0, y1: 1, x2: 1, y2: 1, showLabel: true }] });
  const app = new MI.EditorApp({ engine, document: doc, window: win, storage: { getItem: () => null }, services: { transform: MI.CoordinateTransform, snap: MI.SnapService, resolver: MI.InteractionResolver } });
  app.init();
  const emit = (node, type, values = {}) => [...(node.events.get(type) || [])].forEach(fn => fn({ pointerId: 1, button: 0, preventDefault() {}, ...values }));
  const screen = p => new MI.CoordinateTransform(engine.renderer, { a: .5, d: .5 }).mathToScreen(p);
  const down = (point, target = null, pointerId = 1) => { const p = screen(point); emit(doc.getElementById('canvasWrap'), 'pointerdown', { clientX: p.x, clientY: p.y, target, pointerId }); };
  const move = (point, pointerId = 1) => { const p = screen(point); emit(win, 'pointermove', { clientX: p.x, clientY: p.y, pointerId }); };
  return { MI, engine, app, doc, win, emit, down, move };
}

test('history records a whole drag once, restores selection and ignores cancelled/noop gestures', () => {
  const { app, engine, down, move, emit, win } = appRuntime();
  down({ x: 0, y: 0 }); move({ x: 1, y: 0 }); move({ x: 2, y: 0 }); emit(win, 'pointerup');
  assert.equal(app.history.entries.length, 1);
  app.travelHistory(); assert.equal(engine.get('p').x, 0); assert.equal(app.selectedId, null);
  app.travelHistory(true); assert.equal(engine.get('p').x, 2); assert.equal(app.selectedId, 'p');
  down({ x: 2, y: 0 }); move({ x: 3, y: 0 }); emit(win, 'pointercancel');
  assert.equal(engine.get('p').x, 2); assert.equal(app.history.entries.length, 1);
  down({ x: 2, y: 0 }); emit(win, 'pointerup'); assert.equal(app.history.entries.length, 1);
});
test('draw/delete history, shortcuts, new/import reset and failed import retain a usable history', () => {
  const { app, engine, down, move, emit, win, doc } = appRuntime();
  app.setTool('line'); down({ x: -2, y: -2 }); move({ x: -1, y: -2 }); emit(win, 'pointerup');
  const id = app.selectedId; assert.ok(engine.get(id));
  emit(win, 'keydown', { key: 'z', ctrlKey: true }); assert.equal(engine.get(id), null);
  emit(win, 'keydown', { key: 'Z', ctrlKey: true, shiftKey: true }); assert.ok(engine.get(id));
  doc.activeElement = { tagName: 'INPUT' };
  emit(win, 'keydown', { key: 'z', ctrlKey: true }); assert.ok(engine.get(id));
  doc.activeElement = { tagName: 'BODY' };
  app.setTool('select'); emit(win, 'keydown', { key: 'Delete' }); assert.equal(engine.get(id), null);
  app.travelHistory(); assert.ok(engine.get(id));
  assert.throws(() => app.loadDocument({ objects: [{ type: 'bogus' }] })); assert.equal(app.history.canUndo, true);
  app.loadDocument({ objects: [] }); assert.equal(app.history.canUndo, false); assert.equal(app.history.canRedo, false);
  app.setTool('point'); down({ x: 0, y: 0 }); assert.equal(app.history.canUndo, true);
  app.newDocument(); assert.equal(app.history.canUndo, false);
});
test('one pointer owner commits outside canvas; other pointers cannot replace a drag', () => {
  const { app, engine, down, move, emit, win } = appRuntime();
  down({ x: 0, y: 0 }); down({ x: 4, y: 2 }, null, 2); move({ x: 1, y: 0 }, 2);
  assert.equal(engine.get('p').x, 0); assert.equal(app.interaction.pointerId, 1);
  move({ x: 1, y: 0 }); emit(win, 'pointerup', { target: null });
  assert.equal(engine.get('p').x, 1); assert.equal(app.interaction, null); assert.equal(app.selectedId, 'p');
});
for (const cancel of ['pointercancel', 'blur', 'Escape', 'lostpointercapture']) test(`${cancel} rolls back object/label/endpoint/draw/pan and clears ownership`, () => {
  for (const mode of ['object', 'label', 'endpoint', 'draw', 'pan']) {
    const { app, engine, down, move, emit, win, doc } = appRuntime(); const before = plain(engine.toJSON());
    let target = null, point = { x: 0, y: 0 };
    if (mode === 'label') target = { closest: selector => selector === '.object-label' ? { getAttribute: () => 'p' } : null };
    if (mode === 'endpoint') { target = { closest: selector => selector === '.fzi-line-endpoint' ? { getAttribute: key => key === 'data-line-id' ? 'l' : 'end' } : null }; point = { x: 1, y: 1 }; }
    if (mode === 'draw') app.setTool('line');
    if (mode === 'pan') point = { x: 4, y: 2 };
    down(point, target); move({ x: 2, y: 2 });
    assert.equal(app.interaction.mode, mode);
    emit(cancel === 'lostpointercapture' ? doc.getElementById('canvasWrap') : win, cancel === 'Escape' ? 'keydown' : cancel, { key: 'Escape' });
    assert.equal(app.interaction, null); assert.deepEqual(plain(engine.toJSON()), before);
  }
});
test('responsive labeldrag uses screen transform and obeys tool gating', () => {
  const { app, engine, down, move, emit, win } = appRuntime();
  const label = { closest: selector => selector === '.object-label' ? { getAttribute: () => 'p' } : null };
  const before = engine.get('p').labelDx / engine.renderer.scale();
  down({ x: 0, y: 0 }, label); move({ x: 1, y: 1 }); emit(win, 'pointerup');
  assert.ok(Math.abs(engine.get('p').labelOffsetX - before - 1) < 1e-10);
  const saved = engine.get('p').labelOffsetX;
  app.setTool('line'); down({ x: 0, y: 0 }, label); move({ x: 2, y: 2 }); emit(win, 'keydown', { key: 'Escape' });
  assert.equal(engine.get('p').labelOffsetX, saved);
});
test('New cancels an active drag; dispose/init does not duplicate listeners', () => {
  const { app, engine, doc, win, down, move, emit } = appRuntime();
  down({ x: 0, y: 0 }); move({ x: 1, y: 0 }); app.newDocument();
  assert.equal(app.interaction, null); assert.equal(engine.model.objects.length, 0);
  app.dispose();
  assert.ok([...win.events.values()].every(set => set.size === 0));
  assert.ok([...doc.getElementById('canvasWrap').events.values()].every(set => set.size === 0));
  app.init(); app.setTool('point'); down({ x: 0, y: 0 }); emit(win, 'pointerup');
  assert.equal(engine.model.objects.length, 1);
});

test('painted object target selects and moves a circle center despite mathematical hit-test missing it', () => {
  const { app, engine, down, move, emit, win } = appRuntime();
  engine.add({ id: 'circle', type: 'circle', cx: -2, cy: -1, r: .5 });
  const group = { getAttribute: () => 'circle' };
  down({ x: -2, y: -1 }, { closest: selector => selector === '[data-object-id]' ? group : null });
  assert.equal(app.selectedId, 'circle'); assert.equal(app.interaction.mode, 'object');
  move({ x: -1, y: -1 }); emit(win, 'pointerup');
  assert.ok(Math.abs(engine.get('circle').cx + 1) < 1e-10);
});

test('selecting an object in the sidebar after drawing activates selection and subsequent drag adds no shape', () => {
  const { app, engine, down, move, emit, win } = appRuntime(); app.setTool('point');
  app.viewClick({ target: { closest: selector => selector === '[data-select-object]' ? { dataset: { selectObject: 'p' } } : null } });
  assert.equal(app.tool, 'select'); assert.equal(app.selectedId, 'p');
  const count = engine.model.objects.length;
  down({ x: 0, y: 0 }); move({ x: 1, y: 0 }); emit(win, 'pointerup');
  assert.equal(engine.model.objects.length, count); assert.equal(engine.get('p').x, 1);
});

test('unrecognized drawing tools never fall through into canvas pan', () => {
  const { app, engine, down } = appRuntime(); const before = plain(engine.renderer.bounds);
  app.setTool('unsupported-tool'); down({ x: 4, y: 2 });
  assert.equal(app.interaction, null); assert.deepEqual(plain(engine.renderer.bounds), before);
});
