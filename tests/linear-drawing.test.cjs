const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');

const payload = shape => ({ shape, x1: -2, y1: 1, x2: 3, y2: 4 });

test('drawing a segment creates two movable point sources and one linked segment atomically', () => {
  const { MI } = runtime();
  const engine = new MI.Engine();
  const commands = MI.AuthorCommands(engine);
  const result = commands.execute(commands.createCommand('linear.draw', payload('line'))).result;
  assert.equal(result.length, 3);
  const line = result.find(object => object.type === 'line');
  const points = result.filter(object => object.type === 'point');
  assert.equal(points.length, 2);
  assert.deepEqual(plain(line.construction.sources), plain(points.map(point => ({ objectId: point.id }))));
  assert.deepEqual([line.x1, line.y1, line.x2, line.y2], [-2, 1, 3, 4]);
  engine.update(points[0].id, { x: -4, y: 2 });
  assert.deepEqual([engine.get(line.id).x1, engine.get(line.id).y1], [-4, 2]);
  engine.remove(points[0].id);
  assert.equal(engine.get(line.id), null);
  assert.ok(engine.get(points[1].id));
});

test('drawing a ray creates one linked origin point; dragging or translating the ray moves that point', () => {
  const { MI } = runtime();
  const engine = new MI.Engine();
  const commands = MI.AuthorCommands(engine);
  const result = commands.execute(commands.createCommand('linear.draw', payload('ray'))).result;
  assert.equal(result.length, 2);
  const ray = result.find(object => object.type === 'ray');
  const point = result.find(object => object.type === 'point');
  assert.equal(point.construction.kind, 'rayOrigin');
  assert.deepEqual(plain(point.construction.sources), [{ objectId: ray.id }]);
  engine.update(ray.id, { x1: -5, y1: 2 });
  assert.deepEqual([engine.get(point.id).x, engine.get(point.id).y], [-5, 2]);
  engine.move(ray.id, 1, -1);
  assert.deepEqual([engine.get(point.id).x, engine.get(point.id).y], [1, -1]);
  assert.throws(() => engine.update(point.id, { x: 2 }), /berekend/);
});

test('linear drawing is one restricted command with atomic undo/redo and deterministic sequence replay', () => {
  const { MI } = runtime(['model.js', 'renderer.js', 'index.js', 'semantic-sequence.js']);
  const policy = {
    schema: 1, activityId: 'activity', revision: 'r1', profile: 'course',
    defaultCapabilities: { read: true, display: true, selectCanvas: true, selectList: true, snap: true },
    initialObjectRules: {},
    createdObjectRules: {
      point: { read: true, display: true, selectCanvas: true, selectList: true, snap: true, translate: true, delete: true, geometryFields: ['x', 'y'] },
      line: { read: true, display: true, sourceTools: ['construct:lineBetweenPoints'] },
      ray: { read: true, display: true, translate: true, geometryFields: ['x1', 'y1', 'x2', 'y2'] },
    },
    allowedTools: ['create:line', 'create:ray'],
    document: { undo: true, redo: true, exportSVG: true, exportJSON: true },
    parameters: {}, limits: { maxObjects: 10, maxCommandBytes: 4096, maxBatchObjects: 10, maxDependencyDepth: 10 },
  };
  for (const shape of ['line', 'ray']) {
    const { session } = MI.RuntimeSession.create({ actorId: 'student', initialDocument: { objects: [] }, policy });
    const beforeRevision = session.documentRevision;
    const result = session.execute(session.createCommand('linear.draw', payload(shape))).result;
    assert.ok(result.some(object => object.type === shape));
    assert.equal(session.documentRevision, beforeRevision + 1);
    assert.equal(session.engine.model.objects.length, shape === 'line' ? 3 : 2);
    session.execute(session.createCommand('history.undo', {}));
    assert.equal(session.engine.model.objects.length, 0);
    session.execute(session.createCommand('history.redo', {}));
    assert.equal(session.engine.model.objects.length, shape === 'line' ? 3 : 2);
  }
  const sequence = new MI.SemanticSequence({ objects: [] });
  sequence.execute('linear.draw', payload('line'));
  assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())), plain(sequence.document));
});

test('linear drawing rejects unsupported shapes, degenerate directions, and missing tool grants atomically', () => {
  const { MI } = runtime();
  const engine = new MI.Engine();
  const commands = MI.AuthorCommands(engine);
  for (const bad of [payload('straight'), { ...payload('ray'), x2: -2, y2: 1 }]) {
    assert.throws(() => commands.execute(commands.createCommand('linear.draw', bad)));
    assert.equal(engine.model.objects.length, 0);
  }
  const f = {
    actorId: 'student', initialDocument: { objects: [] },
    policy: { schema: 1, activityId: 'a', revision: 'r1', profile: 'course', defaultCapabilities: {}, initialObjectRules: {}, createdObjectRules: {}, allowedTools: [], document: { undo: true, redo: true }, parameters: {}, limits: { maxObjects: 10, maxCommandBytes: 4096, maxBatchObjects: 10, maxDependencyDepth: 10 } },
  };
  const { session } = MI.RuntimeSession.create(f);
  assert.throws(() => session.execute(session.createCommand('linear.draw', payload('line'))), error => error.code === 'PERMISSION_DENIED');
  assert.equal(session.engine.model.objects.length, 0);
});
