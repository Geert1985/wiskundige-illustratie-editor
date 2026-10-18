'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime } = require('../../../tests/helpers.cjs');
const { createAuthorLifecycle } = require('../lifecycle-coordinator.cjs');

let hostSequence = 0;
function setup(document = { objects: [{ id: 'C', type: 'circle', cx: 0, cy: 0, r: 2 }] }) {
  const { MI } = runtime();
  const engine = new MI.Engine(document);
  const commands = MI.AuthorCommands(engine);
  const lifecycle = createAuthorLifecycle({
    engine,
    commands,
    mutationBoundaryClosed: true,
    contextIdFactory: () => `test-host-${++hostSequence}`
  });
  return { MI, engine, commands, lifecycle };
}

function execute(f, operation, payload = {}) {
  return f.lifecycle.execute(f.commands.createCommand(operation, payload));
}

test('AuthorCommands-commit verhoogt de monotone documentrevisie', () => {
  const f = setup();
  const before = f.lifecycle.documentRevision;
  execute(f, 'object.setGeometry', { id: 'C', fields: [{ path: 'r', value: 3 }] });
  assert.equal(f.lifecycle.documentRevision, before + 1);
});

test('geometrie-update behoudt broninstantie maar maakt eerder resultaat ongeldig', () => {
  const f = setup();
  const old = f.lifecycle.selectSource('C');
  execute(f, 'object.setGeometry', { id: 'C', fields: [{ path: 'r', value: 3 }] });
  const current = f.lifecycle.selectSource('C');
  assert.equal(current.instanceGeneration, old.instanceGeneration);
  assert.equal(f.lifecycle.isBindingCurrent(old), false);
  assert.equal(f.lifecycle.isBindingCurrent(current), true);
});

test('verwijderen, Undo en Redo geven herstelde bron een nieuwe instantie-identiteit', () => {
  const f = setup();
  const app = { engine: f.engine, services: {}, selectedId: 'C', selectedIds: ['C'] };
  const history = new f.MI.EditorHistory(app);
  const beforeDelete = history.capture();
  const original = f.lifecycle.selectSource('C');
  execute(f, 'object.delete', { ids: ['C'] });
  history.record(beforeDelete);
  assert.equal(f.lifecycle.isBindingCurrent(original), false);
  assert.throws(() => f.lifecycle.selectSource('C'), error => error.code === 'SOURCE_UNAVAILABLE');

  assert.equal(f.lifecycle.undo(history), true);
  const restored = f.lifecycle.selectSource('C');
  assert.notEqual(restored.instanceGeneration, original.instanceGeneration);
  assert.equal(f.lifecycle.isBindingCurrent(original), false);
  assert.equal(f.engine.get('C').r, 2);

  assert.equal(f.lifecycle.redo(history), true);
  assert.equal(f.lifecycle.isBindingCurrent(restored), false);
  assert.equal(f.engine.get('C'), null);
});

test('dezelfde object-ID na nieuwe documentinstantie krijgt een andere generatie', () => {
  const f = setup();
  const first = f.lifecycle.selectSource('C');
  const identicalDocument = f.engine.toJSON();
  f.lifecycle.replaceDocument(identicalDocument);
  const second = f.lifecycle.selectSource('C');
  assert.notEqual(second.contextId, first.contextId);
  assert.notEqual(second.instanceGeneration, first.instanceGeneration);
  assert.equal(f.lifecycle.isBindingCurrent(first), false);
});

test('documentvervanging roteert context en invalideert oude handles', () => {
  const f = setup();
  const binding = f.lifecycle.selectSource('C');
  const next = { objects: [{ id: 'D', type: 'point', x: 4, y: 5 }] };
  execute(f, 'document.replace', { document: next });
  assert.notEqual(f.lifecycle.contextId, binding.contextId);
  assert.equal(f.lifecycle.isBindingCurrent(binding), false);
  assert.throws(() => f.lifecycle.selectSource('C'), error => error.code === 'SOURCE_UNAVAILABLE');
});

test('identieke JSON in twee Engine-instanties deelt geen context of binding', () => {
  const document = { objects: [{ id: 'C', type: 'circle', cx: 0, cy: 0, r: 2 }] };
  const a = setup(document), b = setup(document);
  const aBinding = a.lifecycle.selectSource('C'), bBinding = b.lifecycle.selectSource('C');
  assert.notEqual(aBinding.contextId, bBinding.contextId);
  assert.equal(b.lifecycle.isBindingCurrent(aBinding), false);
});

test('ABA-waardeherstel via twee commits herstelt geen eerder resultaat', () => {
  const f = setup();
  const binding = f.lifecycle.selectSource('C');
  execute(f, 'object.setGeometry', { id: 'C', fields: [{ path: 'r', value: 7 }] });
  execute(f, 'object.setGeometry', { id: 'C', fields: [{ path: 'r', value: 2 }] });
  assert.equal(f.engine.get('C').r, 2);
  assert.equal(f.lifecycle.isBindingCurrent(binding), false);
});

test('directe Engine-mutaties zijn expliciet ongedekt en kunnen de teller omzeilen', () => {
  const f = setup();
  const binding = f.lifecycle.selectSource('C');
  const revision = f.lifecycle.documentRevision;
  f.engine.update('C', { r: 9 });
  assert.equal(f.lifecycle.documentRevision, revision);
  assert.equal(f.lifecycle.coverage.directEngineAddUpdateRemoveLoad, 'UNOBSERVED');
  // This counterexample is intentional: the isolated coordinator cannot observe the public Engine alias.
  assert.equal(f.lifecycle.isBindingCurrent(binding), true);
  f.engine.load({ objects: [{ id: 'C', type: 'circle', cx: 0, cy: 0, r: 2 }] });
  assert.equal(f.lifecycle.isBindingCurrent(binding), true);
});

test('preview invalideert vooraf bestaand resultaat ook wanneer preview wordt geannuleerd', () => {
  const f = setup();
  const binding = f.lifecycle.selectSource('C');
  const preview = f.lifecycle.beginPreview();
  assert.equal(f.lifecycle.isBindingCurrent(binding), false);
  f.lifecycle.finishPreview(preview, { committed: false });
  assert.equal(f.lifecycle.isBindingCurrent(binding), false);
  assert.equal(f.lifecycle.documentRevision, 0);
});

test('host sluit fail closed voor oude bindingen en nieuwe aanvragen', () => {
  const f = setup();
  const binding = f.lifecycle.selectSource('C');
  f.lifecycle.dispose();
  assert.throws(() => f.lifecycle.assertBindingCurrent(binding), error => error.code === 'HOST_CLOSED');
  assert.throws(() => f.lifecycle.selectSource('C'), error => error.code === 'HOST_CLOSED');
});

test('bindings worden geweigerd zolang de author-mutatiegrens niet bewezen gesloten is', () => {
  const { MI } = runtime();
  const engine = new MI.Engine({ objects: [{ id: 'C', type: 'circle', cx: 0, cy: 0, r: 2 }] });
  const lifecycle = createAuthorLifecycle({ engine, commands: MI.AuthorCommands(engine) });
  assert.equal(lifecycle.coverage.directEngineAddUpdateRemoveLoad, 'UNOBSERVED');
  assert.throws(() => lifecycle.selectSource('C'), error => error.code === 'MUTATION_BOUNDARY_UNPROVEN');
});
