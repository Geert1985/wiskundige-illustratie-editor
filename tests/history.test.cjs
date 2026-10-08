const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { root } = require('./helpers.cjs');
function setup(limit) {
  const { MI, context } = runtime();
  vm.runInContext(fs.readFileSync(path.join(root, 'editor-history.js'), 'utf8'), context);
  const engine = new MI.Engine();
  const app = { engine, selectedId: null };
  const history = new MI.EditorHistory(app, { limit });
  return { app, engine, history };
}
test('undo/redo restores documents, presentation and selection on the same engine', () => {
  const { app, engine, history } = setup(); const before = history.capture();
  app.selectedId = engine.add({ type: 'point', x: 1, y: 2 }).id;
  engine.renderer.showAxes = false;
  const after = plain(engine.toJSON()); history.record(before);
  assert.equal(history.undo(), true); assert.equal(engine.model.objects.length, 0); assert.equal(app.selectedId, null);
  assert.equal(history.redo(), true); assert.deepEqual(plain(engine.toJSON()), after); assert.equal(app.selectedId, engine.model.objects[0].id);
  assert.equal(app.engine, engine);
});
test('noops retain redo; a new document edit discards redo', () => {
  const { engine, history } = setup(); let before = history.capture();
  engine.add({ type: 'point', x: 0, y: 0 }); history.record(before); history.undo();
  history.record(history.capture()); assert.equal(history.canRedo, true);
  before = history.capture(); engine.add({ type: 'circle', cx: 0, cy: 0, r: 1 }); history.record(before);
  assert.equal(history.canRedo, false);
});
test('bounded history and reset do not leak document data into serialization', () => {
  const { engine, history } = setup(2);
  for (let i = 0; i < 3; i++) { const before = history.capture(); engine.add({ type: 'point', x: i, y: i }); history.record(before); }
  history.undo(); history.undo(); assert.equal(history.undo(), false); assert.equal(engine.model.objects.length, 1);
  history.clear(); assert.equal(history.canRedo, false); assert.equal(history.canUndo, false);
  assert.equal(engine.toJSON().version, 2); assert.equal('history' in engine.toJSON(), false);
});
test('failed restore preserves history cursor and current document', () => {
  const { engine, history } = setup(); const before = history.capture(); engine.add({ type: 'point', x: 0, y: 0 }); history.record(before);
  const load = engine.load; engine.load = () => { throw Error('failed'); };
  assert.throws(() => history.undo(), /failed/); assert.equal(history.canUndo, true); assert.equal(history.canRedo, false);
  engine.load = load; assert.equal(history.undo(), true);
});
test('memory budget evicts oldest commands while retaining the most recent reversible command', () => {
  const { app, engine } = setup();
  const { MI, context } = runtime(); vm.runInContext(fs.readFileSync(path.join(root, 'editor-history.js'), 'utf8'), context);
  const history = new MI.EditorHistory(app, { maxBytes: 1 });
  for (let i = 0; i < 4; i++) { const before = history.capture(); engine.add({ type: 'point', x: i, y: 0 }); history.record(before); }
  assert.equal(history.entries.length, 1); history.undo(); assert.equal(engine.model.objects.length, 3);
});
test('restoring and branching generated IDs cannot collide with remaining objects', () => {
  const { engine, history } = setup();
  for (let i = 0; i < 3; i++) { const before = history.capture(); engine.add({ type: 'point', x: i, y: 0 }); history.record(before); }
  history.undo(); const before = history.capture(); engine.add({ type: 'circle', cx: 0, cy: 0, r: 1 }); history.record(before);
  const ids = engine.model.objects.map(o => o.id); assert.equal(new Set(ids).size, ids.length); assert.equal(history.canRedo, false);
});
