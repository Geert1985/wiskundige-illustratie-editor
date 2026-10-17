const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');

function setup(objects) {
  const { MI } = runtime(['model.js', 'renderer.js', 'index.js', 'semantic-sequence.js', 'intersection-dispatcher.js']);
  return { MI, map: new Map(objects.map(object => [object.id, object])) };
}

test('dispatcher normalizes mixed line-circle order and retains source part references', () => {
  const { MI, map } = setup([
    { id: 'L', type: 'line', x1: 0, y1: 0, x2: 4, y2: 0 },
    { id: 'C', type: 'circle', cx: 2, cy: 0, r: 1 },
    { id: 'P', type: 'polygon', vertices: [{ x: -1, y: 0 }, { x: 5, y: 0 }, { x: 0, y: 3 }] },
  ]);
  const refs = [{ objectId: 'C' }, { objectId: 'P', part: 'edge', index: 0 }];
  const pair = MI.IntersectionDispatcher.classify(refs, map);
  assert.equal(pair.kind, 'lineCircleIntersection');
  assert.deepEqual(plain(pair.sources), [refs[1], refs[0]]);
  const result = MI.IntersectionDispatcher.evaluate(refs, map);
  assert.deepEqual(plain(result.candidates.map(({ branch, x }) => [branch, x])), [[0, 1], [1, 3]]);
  assert.deepEqual(plain(result.candidates[0].recipe.sources), [refs[1], refs[0]]);
});

test('dispatcher preserves circle source order and existing left/right branch identities', () => {
  const { MI, map } = setup([
    { id: 'A', type: 'circle', cx: 0, cy: 0, r: 2 },
    { id: 'B', type: 'circle', cx: 0, cy: 2, r: 2 },
  ]);
  const result = MI.IntersectionDispatcher.evaluate([{ objectId: 'A' }, { objectId: 'B' }], map);
  assert.equal(result.kind, 'circleCircleIntersection');
  assert.deepEqual(plain(result.candidates.map(({ branch, x, y }) => [branch, x, y])), [[0, -Math.sqrt(3), 1], [1, Math.sqrt(3), 1]]);
  const reverse = MI.IntersectionDispatcher.evaluate([{ objectId: 'B' }, { objectId: 'A' }], map);
  assert.deepEqual(plain(reverse.candidates.map(({ branch }) => branch)), [0, 1]);
  assert.ok(reverse.candidates[0].x > 0);
});

test('dispatcher keeps original branch 1 when only that intersection lies in a finite domain', () => {
  const { MI, map } = setup([
    { id: 'L', type: 'line', x1: 2, y1: 0, x2: 4, y2: 0 },
    { id: 'C', type: 'circle', cx: 0, cy: 0, r: 3 },
  ]);
  const result = MI.IntersectionDispatcher.evaluate([{ objectId: 'L' }, { objectId: 'C' }], map);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].branch, 1);
  assert.equal(result.candidates[0].x, 3);
});

test('dispatcher returns one line-line candidate and distinguishes unsupported pairs', () => {
  const { MI, map } = setup([
    { id: 'A', type: 'straight', x1: -1, y1: -1, x2: 1, y2: 1 },
    { id: 'B', type: 'vector', x1: -1, y1: 1, x2: 1, y2: -1 },
    { id: 'P', type: 'polygon', vertices: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }] },
  ]);
  const lineResult = MI.IntersectionDispatcher.evaluate([{ objectId: 'A' }, { objectId: 'B' }], map);
  assert.equal(lineResult.kind, 'lineIntersection');
  assert.equal(lineResult.candidates.length, 1);
  assert.deepEqual([lineResult.candidates[0].x, lineResult.candidates[0].y], [0, 0]);
  const unsupported = MI.IntersectionDispatcher.evaluate([{ objectId: 'A' }, { objectId: 'P' }], map);
  assert.equal(unsupported.supported, false);
  assert.equal(unsupported.reasonCode, 'UNSUPPORTED_PAIR');
  assert.equal(unsupported.candidates.length, 0);
});

test('dispatcher permits Cartesian axes only in the existing recipe roles', () => {
  const { MI, map } = setup([{ id: 'C', type: 'circle', cx: 0, cy: 0, r: 2 }]);
  const x = { kind: 'axis', frame: 'cartesian', axis: 'x' };
  const circlePair = MI.IntersectionDispatcher.evaluate([x, { objectId: 'C' }], map);
  assert.equal(circlePair.kind, 'lineCircleIntersection');
  assert.deepEqual(plain(circlePair.candidates.map(({ branch, x }) => [branch, x])), [[0, -2], [1, 2]]);
  const y = { kind: 'axis', frame: 'cartesian', axis: 'y' };
  assert.equal(MI.IntersectionDispatcher.classify([y, { objectId: 'C' }], map).kind, 'lineCircleIntersection');
  const invalid = MI.IntersectionDispatcher.classify([x, y], map);
  assert.equal(invalid.kind, 'lineIntersection');
  assert.equal(MI.IntersectionDispatcher.classify([x, { objectId: 'C' }], new Map()).supported, false);
});

test('selected intersection branches commit atomically through the existing command and replay path', () => {
  const { MI } = setup([
    { id: 'L', type: 'line', x1: 0, y1: 0, x2: 4, y2: 0 },
    { id: 'C', type: 'circle', cx: 2, cy: 0, r: 1 },
  ]);
  const initial = { objects: [{ id: 'L', type: 'line', x1: 0, y1: 0, x2: 4, y2: 0 }, { id: 'C', type: 'circle', cx: 2, cy: 0, r: 1 }] };
  const engine = new MI.Engine(initial), commands = MI.AuthorCommands(engine);
  const made = commands.execute(commands.createCommand('construction.create', {
    toolId: 'construct:lineCircleIntersection', sources: [{ objectId: 'L' }, { objectId: 'C' }], selectedBranches: [1],
  })).result;
  assert.equal(made.length, 1);
  assert.equal(made[0].construction.branch, 1);
  assert.equal(made[0].x, 3);
  const before = JSON.stringify(engine.toJSON());
  assert.throws(() => commands.execute(commands.createCommand('construction.create', {
    toolId: 'construct:lineCircleIntersection', sources: [{ objectId: 'L' }, { objectId: 'C' }], selectedBranches: [0, 0],
  })));
  assert.equal(JSON.stringify(engine.toJSON()), before);
  const sequence = new MI.SemanticSequence(initial);
  sequence.execute('construction.create', { toolId: 'construct:lineCircleIntersection', sources: [{ objectId: 'L' }, { objectId: 'C' }], selectedBranches: [1] });
  assert.equal(sequence.document.objects.at(-1).construction.branch, 1);
  assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())), plain(sequence.document));
});
