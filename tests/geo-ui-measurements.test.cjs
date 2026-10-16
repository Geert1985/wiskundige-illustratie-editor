const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('./helpers.cjs');

function settingsFor(MI, object, visibleKeys = [], offsets = {}) {
  return {
    schema: 1,
    values: Object.fromEntries(MI.MeasurementGeometry.measurementKeys(object).map(key => [key, {
      visible: visibleKeys.includes(key), precision: null, mode: 'computed', text: '',
      dx: offsets[key]?.dx || 0, dy: offsets[key]?.dy || 0
    }]))
  };
}
function documentWith(object, MI, visibleKeys = [], offsets = {}) {
  return { version: 10, measurementSchema: 1, objects: [{ ...object, measurements: settingsFor(MI, object, visibleKeys, offsets) }] };
}

test('measurement families expose only finite, mathematically applicable quantities', () => {
  const { MI } = runtime(), keys = MI.MeasurementGeometry.measurementKeys;
  assert.deepEqual(Array.from(keys({ type: 'line' })), ['length']);
  assert.deepEqual(Array.from(keys({ type: 'dimension' })), ['length']);
  assert.deepEqual(Array.from(keys({ type: 'angle' })), ['angle']);
  assert.deepEqual(Array.from(keys({ type: 'circle' })), ['radius', 'diameter', 'circumference', 'area']);
  assert.deepEqual(Array.from(keys({ type: 'polygon', vertices: [{}, {}, {}] })), ['side:0', 'side:1', 'side:2', 'angle:0', 'angle:1', 'angle:2', 'perimeter', 'area']);
  assert.deepEqual(Array.from(keys({ type: 'ellipse' })), ['semiMajor', 'semiMinor', 'majorAxis', 'minorAxis', 'eccentricity', 'area']);
  assert.deepEqual(Array.from(keys({ type: 'straight' })), []);
  assert.deepEqual(Array.from(keys({ type: 'ray' })), []);
  assert.deepEqual(Array.from(keys({ type: 'vector' })), []);
  assert.equal(MI.MeasurementGeometry.label({ type: 'straight' }), 'geen eindige lengte');
  assert.equal(MI.MeasurementGeometry.label({ type: 'ray' }), 'geen eindige lengte');
});

test('circle has 16 independent visibility states and stable distinct label identities', () => {
  const { MI } = runtime(), circle = { id: 'C', type: 'circle', cx: 0, cy: 0, r: 3 };
  for (let mask = 0; mask < 16; mask++) {
    const enabled = MI.MeasurementGeometry.measurementKeys(circle).filter((_, i) => mask & (1 << i));
    const e = new MI.Engine(documentWith(circle, MI, enabled)), svg = e.renderSVG();
    const labels = [...svg.matchAll(/data-measurement-kind="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(labels.sort(), [...enabled].sort(), `visibility mask ${mask}`);
  }
  const all = new MI.Engine(documentWith(circle, MI, ['radius', 'diameter', 'circumference', 'area'])).renderSVG();
  assert.equal((all.match(/data-measurement-kind=/g) || []).length, 4);
  assert.match(all, /data-measurement-kind="radius"/);
  assert.match(all, /data-measurement-kind="diameter"/);
  assert.match(all, /data-measurement-kind="circumference"/);
  assert.match(all, /data-measurement-kind="area"/);
});

test('independent values use one unit scale and correct L, L², angle, and dimensionless formatting', () => {
  const { MI } = runtime(), meta = { schema: 1, unit: 'cm', scale: 2, precision: 2 };
  const circle = { id: 'C', type: 'circle', cx: 0, cy: 0, r: 3 };
  let config = settingsFor(MI, circle, ['radius', 'diameter', 'circumference', 'area']);
  assert.equal(MI.MeasurementGeometry.measurementLabel(circle, 'radius', config, meta), 'Straal: 6,00 cm');
  assert.equal(MI.MeasurementGeometry.measurementLabel(circle, 'diameter', config, meta), 'Diameter: 12,00 cm');
  assert.equal(MI.MeasurementGeometry.measurementLabel(circle, 'circumference', config, meta), 'Omtrek: 37,70 cm');
  assert.equal(MI.MeasurementGeometry.measurementLabel(circle, 'area', config, meta), 'Oppervlakte: 113,10 cm²');

  const polygon = { id: 'P', type: 'polygon', vertices: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }] };
  config = settingsFor(MI, polygon, ['side:0', 'side:1', 'side:2', 'angle:0', 'angle:1', 'angle:2', 'perimeter', 'area']);
  assert.equal(MI.MeasurementGeometry.measurementValue(polygon, 'side:0'), 3);
  assert.equal(MI.MeasurementGeometry.measurementValue(polygon, 'side:1'), 4);
  assert.equal(MI.MeasurementGeometry.measurementValue(polygon, 'side:2'), 5);
  assert.equal(MI.MeasurementGeometry.measurementValue(polygon, 'angle:1'), 90);
  assert.equal(MI.MeasurementGeometry.measurementValue(polygon, 'perimeter'), 12);
  assert.equal(MI.MeasurementGeometry.measurementValue(polygon, 'area'), 6);
  assert.equal(MI.MeasurementGeometry.measurementLabel(polygon, 'perimeter', config, meta), 'Omtrek: 24,00 cm');
  assert.equal(MI.MeasurementGeometry.measurementLabel(polygon, 'area', config, meta), 'Oppervlakte: 24,00 cm²');

  const ellipse = new MI.Engine({ version: 9, ellipseSchema: 1, objects: [{ id: 'E', type: 'ellipse', cx: 0, cy: 0, a: 5, b: 3, rotation: 0 }] }).get('E');
  config = settingsFor(MI, ellipse, ['eccentricity', 'area']);
  assert.ok(Math.abs(MI.MeasurementGeometry.measurementValue(ellipse, 'eccentricity') - .8) < 1e-12);
  assert.equal(MI.MeasurementGeometry.measurementLabel(ellipse, 'eccentricity', config, meta), 'Excentriciteit: 0,80');
  assert.equal(MI.MeasurementGeometry.measurementLabel(ellipse, 'area', config, meta), 'Oppervlakte: 188,50 cm²');

  const line = { id: 'L', type: 'line', x1: 0, y1: 0, x2: 3, y2: 4 };
  config = settingsFor(MI, line, ['length']);
  assert.equal(MI.MeasurementGeometry.measurementLabel(line, 'length', config, meta), 'Lengte: 10,00 cm');
});

test('legacy visibility and free-text defaults survive first independent edit without duplicate labels', () => {
  const { MI } = runtime();
  const circle = { id: 'C', type: 'circle', cx: 0, cy: 0, r: 3, showMeasurement: true, measurementMode: 'text', measurementText: 'r = 3 cm' };
  const defaults = MI.MeasurementGeometry.defaultMeasurementSettings(circle);
  assert.equal(defaults.values.radius.visible, true);
  assert.equal(defaults.values.radius.mode, 'text');
  assert.equal(defaults.values.radius.text, 'r = 3 cm');
  assert.equal(defaults.values.diameter.visible, false);
  const legacy = new MI.Engine({ objects: [circle] });
  assert.equal((legacy.renderSVG().match(/data-measurement-label/g) || []).length, 1);
  const migrated = { ...circle, measurements: defaults };
  const upgraded = new MI.Engine({ version: 10, measurementSchema: 1, objects: [migrated] });
  const svg = upgraded.renderSVG();
  assert.equal((svg.match(/data-measurement-kind=/g) || []).length, 1);
  assert.equal((svg.match(/data-measurement-label/g) || []).length, 0);
  assert.match(svg, />r = 3 cm<\/text>/);
});

test('dependent circle labels recalculate dynamically and keep independent offsets after reimport', () => {
  const { MI } = runtime(), e = new MI.Engine({ objects: [
    { id: 'O', type: 'point', x: 0, y: 0 }, { id: 'P', type: 'point', x: 3, y: 0 }
  ] });
  const circle = e.construct('circleByCenterPoint', [{ objectId: 'O' }, { objectId: 'P' }])[0];
  const config = settingsFor(MI, circle, ['radius', 'circumference'], { radius: { dx: 1, dy: 2 }, circumference: { dx: -2, dy: 1 } });
  const commands = MI.AuthorCommands(e);
  commands.execute(commands.createCommand('object.setProperties', { ids: [circle.id], fields: [{ path: 'measurements', value: config }] }));
  const first = e.renderSVG();
  assert.match(first, /Straal: 3,00/);
  assert.match(first, /Omtrek: 18,85/);
  e.update('P', { x: 4, y: 0 });
  const updated = e.renderSVG();
  assert.match(updated, /Straal: 4,00/);
  assert.match(updated, /Omtrek: 25,13/);
  assert.doesNotMatch(updated, /Straal: 3,00|Omtrek: 18,85/);
  assert.deepEqual(plain(e.get(circle.id).measurements), plain(config));
  const saved = plain(e.toJSON());
  assert.equal(saved.version, 10);
  assert.equal(saved.measurementSchema, 1);
  assert.deepEqual(plain(new MI.Engine(saved).toJSON()), saved);
});

test('measurement edits persist in v10 semantic replay and reject incompatible schemas atomically', () => {
  const { MI } = runtime(['model.js', 'renderer.js', 'index.js', 'semantic-sequence.js']), circle = { id: 'C', type: 'circle', cx: 1, cy: 2, r: 3 };
  const sequence = new MI.SemanticSequence({ objects: [circle] });
  sequence.execute('object.setProperties', { ids: ['C'], fields: [{ path: 'measurements', value: settingsFor(MI, circle, ['radius', 'area']) }] });
  const saved = sequence.document;
  assert.equal(saved.version, 10);
  assert.equal(saved.measurementSchema, 1);
  assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())), plain(saved));
  const engine = new MI.Engine(saved), before = plain(engine.toJSON());
  for (const bad of [
    { ...saved, version: 9 },
    { ...saved, measurementSchema: 2 },
    { ...saved, objects: [{ ...saved.objects[0], measurements: { schema: 1, values: { unknown: { visible: true } } } }] }
  ]) {
    assert.throws(() => engine.load(bad));
    assert.deepEqual(plain(engine.toJSON()), before);
  }
  assert.equal(new MI.Engine({ version: 9, ellipseSchema: 1, objects: [{ id: 'E', type: 'ellipse', cx: 0, cy: 0, a: 5, b: 4, rotation: 0 }] }).toJSON().version, 9);
});
