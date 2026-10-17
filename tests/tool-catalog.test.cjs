const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../tool-catalog.js'), 'utf8');
function catalogApi() {
  const context = { window: {}, Object, Array, Map, TypeError, Number };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'tool-catalog.js' });
  return context.window.FZI.MathIllustration.ToolCatalog;
}
const tool = (id, lifecycle = 'repeat', interactionAdapter = 'point') => ({ id, label: id, status: 'implemented', commandToolId: id.startsWith('construct:') ? id : 'create:' + id, lifecycle, interactionAdapter });

test('tool catalog provides the same immutable categories for sidebar and fullscreen', () => {
  const api = catalogApi();
  const catalog = api.create({
    categories: [
      { id: 'vrije-objecten', label: 'Vrije objecten', emptySubgroups: [{ id: 'vectoren', label: 'Vectoren' }], entries: [
        { ...tool('point'), markup: '<span>Punt</span>' },
        { ...tool('line', 'repeat', 'draw'), splitGroup: 'linear', markup: '<span>Lijnstuk</span>' },
        { label: 'Ellips', status: 'planned', markup: '<span>Ellips</span>' },
      ] },
    ],
    splits: [{ id: 'linear', mainId: 'linearToolMain', toggleId: 'linearToolToggle', menuId: 'linearToolMenu', toolIds: ['line'] }],
  });
  assert.deepEqual(Array.from(catalog.list('sidebar'), category => category.id), ['vrije-objecten']);
  assert.deepEqual(Array.from(catalog.list('fullscreen'), category => category.id), ['vrije-objecten']);
  assert.ok(Object.isFrozen(catalog.list('sidebar')[0].entries[0]));
  assert.equal(catalog.getTool('point').commandToolId, 'create:point');
  assert.equal(catalog.getTool('line').interactionAdapter, 'draw');
  assert.equal(catalog.getTool('line').lifecycle, 'repeat');
  assert.equal(catalog.getSplitForTool('line').id, 'linear');
  assert.equal(catalog.getSplit('missing'), null);
  assert.deepEqual(Array.from(catalog.list('fullscreen')[0].emptySubgroups, subgroup => subgroup.label), ['Vectoren']);
  const planned = catalog.list('sidebar')[0].entries.find(entry => entry.status === 'planned');
  assert.deepEqual(Object.keys(planned).sort(), ['label', 'markup', 'status', 'title']);
});

test('empty subgroups keep presentation metadata without inventing a tool ID', () => {
  const api = catalogApi();
  const catalog = api.create({ categories: [{ id: 'constructies', label: 'Constructies', entries: [], emptySubgroups: [{ id: 'vectoren', label: 'Vectoren' }] }], splits: [] });
  assert.deepEqual(Array.from(catalog.list('sidebar')[0].entries), []);
  assert.equal(catalog.getTool('vectorAB'), null);
  assert.ok(Object.isFrozen(catalog.list('sidebar')[0].emptySubgroups[0]));
});

test('tool catalog rejects duplicate IDs, unknown split choices, and actionable planned entries', () => {
  const api = catalogApi();
  assert.throws(() => api.create({ categories: [
    { id: 'a', label: 'A', entries: [tool('point')] },
    { id: 'b', label: 'B', entries: [tool('point')] },
  ], splits: [] }), /Dubbele tool-ID/);
  assert.throws(() => api.create({ categories: [{ id: 'a', label: 'A', entries: [{ id: 'future', label: 'Toekomst', status: 'planned', commandToolId: 'create:future' }] }], splits: [] }), /geplande tool mag niet interactief zijn/);
  assert.throws(() => api.create({ categories: [{ id: 'a', label: 'A', entries: [{ label: 'Toekomst', status: 'planned', lifecycle: 'repeat', interactionAdapter: 'point' }] }], splits: [] }), /geplande tool mag niet interactief zijn/);
  assert.throws(() => api.create({ categories: [{ id: 'a', label: 'A', entries: [tool('point')] }], splits: [{ id: 'linear', mainId: 'm', toggleId: 't', menuId: 'menu', toolIds: ['line'] }] }), /Ongeldige splitgroep/);
});

test('tool catalog rejects missing or unknown lifecycle and adapter metadata', () => {
  const api = catalogApi();
  const create = entry => api.create({ categories: [{ id: 'a', label: 'A', entries: [entry] }], splits: [] });
  const missingId = tool('point');
  delete missingId.id;
  assert.throws(() => create(missingId), /vereist stabiele tool- en command-ID/);
  assert.throws(() => create({ ...tool('point'), lifecycle: undefined }), /Unknown lifecycle policy for tool: point/);
  assert.throws(() => create({ ...tool('point'), lifecycle: 'sometimes' }), /Unknown lifecycle policy for tool: point/);
  assert.throws(() => create({ ...tool('point'), interactionAdapter: undefined }), /Missing interaction adapter for tool: point/);
  assert.throws(() => create({ ...tool('point'), interactionAdapter: 'magic' }), /Unknown interaction adapter for tool: point/);
  assert.throws(() => create({ ...tool('point'), status: 'experimental' }), /Ongeldig gereedschap/);
  assert.throws(() => create(tool('select')), /navigatiemodus/);
});

test('editor markup declares all 37 existing creation tools and keeps placeholders out of the registry', () => {
  const html = fs.readFileSync(path.join(__dirname, '../editor.html'), 'utf8');
  const expectedIds = ['point','line','straight','ray','vector','triangle','polygon','circle','angle','rightAngle','dimension','text','construct:midpoint','construct:pointOnObject','construct:intersection','construct:perpendicular','construct:perpendicularBisector','construct:bisector','construct:lineBetweenPoints','construct:parallel','construct:tangent','construct:circleByCenterPoint','construct:ellipseByFociAndPoint','construct:parallelogramBySideAngle','construct:triangleFromPoints','construct:centroid','construct:circumcenter','construct:orthocenter','construct:incenter','construct:incircle','construct:eulerLine','construct:ninePointCircle','construct:anglePoints','construct:angleDirections','construct:polygonRegion','construct:circleSectorRegion','construct:circleSegmentRegion'];
  const tools = [...html.matchAll(/<button\b[^>]*\bdata-tool="([^"]+)"[^>]*>/g)].filter(match => match[1] !== 'select').map(match => {
    const tag = match[0], id = match[1];
    const lifecycle = tag.match(/\bdata-lifecycle="([^"]+)"/)?.[1];
    const adapter = tag.match(/\bdata-interaction-adapter="([^"]+)"/)?.[1];
    return { id, lifecycle, adapter };
  });
  assert.equal(tools.length, 37);
  assert.equal(new Set(tools.map(entry => entry.id)).size, 37);
  assert.deepEqual(tools.map(entry => entry.id).sort(), expectedIds.sort());
  assert.equal(tools.filter(entry => entry.lifecycle === 'repeat').length, 12);
  assert.equal(tools.filter(entry => entry.lifecycle === 'single').length, 25);
  assert.ok(tools.every(entry => entry.lifecycle && ['point', 'draw', 'polygon', 'construction', 'placement', 'text'].includes(entry.adapter)));
  const adapterIds = Object.fromEntries(['point', 'draw', 'polygon', 'construction', 'placement', 'text'].map(adapter => [adapter, tools.filter(entry => entry.adapter === adapter).map(entry => entry.id).sort()]));
  assert.deepEqual(Object.fromEntries(Object.entries(adapterIds).map(([adapter, ids]) => [adapter, ids.length])), { point: 1, draw: 6, polygon: 4, construction: 22, placement: 3, text: 1 });
  assert.deepEqual(adapterIds.point, ['point']);
  assert.deepEqual(adapterIds.draw, ['circle', 'dimension', 'line', 'ray', 'straight', 'vector']);
  assert.deepEqual(adapterIds.polygon, ['angle', 'polygon', 'rightAngle', 'triangle']);
  assert.deepEqual(adapterIds.placement, ['construct:ellipseByFociAndPoint', 'construct:parallelogramBySideAngle', 'construct:pointOnObject']);
  assert.deepEqual(adapterIds.text, ['text']);
  assert.deepEqual(adapterIds.construction, expectedIds.filter(id => id.startsWith('construct:') && !adapterIds.placement.includes(id)).sort());
  assert.ok(tools.every(entry => entry.id !== 'select'));
  assert.equal(tools.find(entry => entry.id === 'construct:midpoint').id, 'construct:midpoint');
  assert.match(html, /class="tool-placeholder"/);
});

test('WIE-TOOL-L5.5 specialized tools retain their declared lifecycle and route adapter', () => {
  const html = fs.readFileSync(path.join(__dirname, '../editor.html'), 'utf8');
  const expected = new Map([
    ['construct:intersection', ['single', 'construction']],
    ['construct:pointOnObject', ['single', 'placement']],
    ['construct:ellipseByFociAndPoint', ['single', 'placement']],
    ['construct:parallelogramBySideAngle', ['single', 'placement']],
    ['text', ['repeat', 'text']],
  ]);
  const entries = [...html.matchAll(/<button\b[^>]*\bdata-tool="([^"]+)"[^>]*>/g)]
    .map(match => ({ id: match[1], lifecycle: match[0].match(/\bdata-lifecycle="([^"]+)"/)?.[1], adapter: match[0].match(/\bdata-interaction-adapter="([^"]+)"/)?.[1] }));
  for (const [id, [lifecycle, adapter]] of expected) {
    assert.deepEqual(entries.find(entry => entry.id === id), { id, lifecycle, adapter }, id);
  }
});
