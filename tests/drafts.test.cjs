const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, fixture, plain } = require('./helpers.cjs');
function store() {
  const values = new Map();
  return { values, getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function draftRuntime() {
  class Storage { getItem() { return 'untouched'; } }
  const original = Storage.prototype.getItem;
  const result = runtime(['model.js', 'renderer.js', 'index.js', 'editor-startup.js'], { Storage, setTimeout() {} });
  return { ...result, Storage, original };
}
test('startup does not change Storage.prototype', () => {
  const { Storage, original } = draftRuntime();
  assert.equal(Storage.prototype.getItem, original);
});
test('save then startup restore keeps the document and persistent presentation', () => {
  const { MI } = draftRuntime(); const storage = store(); const e = new MI.Engine(fixture('geometry.json'));
  e.renderer.showGrid = true; e.renderer.showXAxis = false;
  MI.DraftStore.save(e, storage);
  const reloaded = new MI.Engine();
  assert.equal(MI.DraftStore.restore(reloaded, storage), true);
  assert.deepEqual(plain(reloaded.toJSON()), plain(e.toJSON()));
});
test('corrupt or rejected draft is preserved and does not replace the current document', () => {
  const { MI } = draftRuntime(); const storage = store(); const e = new MI.Engine(fixture('geometry.json'));
  const before = plain(e.toJSON());
  for (const raw of ['{bad', JSON.stringify({ objects: [{ id: 'a', type: 'point' }, { id: 'a', type: 'point' }] })]) {
    storage.setItem(MI.DraftStore.key, raw);
    assert.throws(() => MI.DraftStore.restore(e, storage));
    assert.equal(storage.getItem(MI.DraftStore.key), raw);
    assert.deepEqual(plain(e.toJSON()), before);
  }
});
test('empty storage, explicit clear and denied storage have predictable behavior', () => {
  const { MI } = draftRuntime(); const storage = store(); const e = new MI.Engine();
  assert.equal(MI.DraftStore.restore(e, storage), false);
  MI.DraftStore.save(e, storage); MI.DraftStore.clear(storage);
  assert.equal(MI.DraftStore.restore(e, storage), false);
  const denied = { getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } };
  assert.throws(() => MI.DraftStore.restore(e, denied), /denied/);
  assert.throws(() => MI.DraftStore.save(e, denied), /quota/);
});
