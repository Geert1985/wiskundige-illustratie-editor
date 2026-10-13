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

test('tool catalog provides the same immutable categories for sidebar and fullscreen', () => {
  const api = catalogApi();
  const catalog = api.create({
    categories: [
      { id: 'vrije-objecten', label: 'Vrije objecten', entries: [
        { id: 'point', label: 'Punt', status: 'implemented', commandToolId: 'create:point', markup: '<span>Punt</span>' },
        { id: 'line', label: 'Lijnstuk', status: 'implemented', commandToolId: 'create:line', splitGroup: 'linear', markup: '<span>Lijnstuk</span>' },
        { label: 'Ellips', status: 'planned', markup: '<span>Ellips</span>' },
      ] },
    ],
    splits: [{ id: 'linear', mainId: 'linearToolMain', toggleId: 'linearToolToggle', menuId: 'linearToolMenu', toolIds: ['line'] }],
  });
  assert.deepEqual(Array.from(catalog.list('sidebar'), category => category.id), ['vrije-objecten']);
  assert.deepEqual(Array.from(catalog.list('fullscreen'), category => category.id), ['vrije-objecten']);
  assert.ok(Object.isFrozen(catalog.list('sidebar')[0].entries[0]));
  assert.equal(catalog.getTool('point').commandToolId, 'create:point');
  assert.equal(catalog.getSplitForTool('line').id, 'linear');
  assert.equal(catalog.getSplit('missing'), null);
  const planned = catalog.list('sidebar')[0].entries.find(entry => entry.status === 'planned');
  assert.deepEqual(Object.keys(planned).sort(), ['label', 'markup', 'status']);
});

test('tool catalog rejects duplicate IDs, unknown split choices, and actionable planned entries', () => {
  const api = catalogApi();
  const tool = id => ({ id, label: id, status: 'implemented', commandToolId: 'create:' + id });
  assert.throws(() => api.create({ categories: [
    { id: 'a', label: 'A', entries: [tool('point')] },
    { id: 'b', label: 'B', entries: [tool('point')] },
  ], splits: [] }), /Dubbele tool-ID/);
  assert.throws(() => api.create({ categories: [{ id: 'a', label: 'A', entries: [{ id: 'future', label: 'Toekomst', status: 'planned', commandToolId: 'create:future' }] }], splits: [] }), /geplande tool mag niet interactief zijn/);
  assert.throws(() => api.create({ categories: [{ id: 'a', label: 'A', entries: [tool('point')] }], splits: [{ id: 'linear', mainId: 'm', toggleId: 't', menuId: 'menu', toolIds: ['line'] }] }), /Ongeldige splitgroep/);
});
