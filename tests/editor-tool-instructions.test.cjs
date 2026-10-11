const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { runtime, root } = require('./helpers.cjs');

function setup() {
  const { MI, context } = runtime();
  vm.runInContext(fs.readFileSync(path.join(root, 'editor-tool-instructions.js'), 'utf8'), context);
  return MI.ToolInstructions;
}

test('instruction service preserves tool progression and legacy hint text', () => {
  const instructions = setup();
  assert.equal(instructions.describe('construct:lineIntersection', { mode: 'construction', sources: [{}] }).index, 1);
  assert.equal(instructions.describe('triangle', { mode: 'polygon', vertices: [{}, {}] }).index, 2);
  assert.equal(instructions.describe('text', null, true).index, 1);
  assert.equal(instructions.describe('line', null).total, 2);
  assert.equal(instructions.describe('ray', null).total, 1);
  assert.match(instructions.toolHint('ray'), /alleen het beginpunt is een Punt-object/);
  assert.equal(instructions.toolHint('line'), 'Sleep voor een vrij lijnstuk zonder losse eindpuntobjecten. Typ voor een exacte lengte.');
  assert.equal(instructions.constructionHint('lineBetweenPoints', 0), 'Selecteer het eerste punt.');
  assert.equal(instructions.constructionHint('lineBetweenPoints', 1), 'Selecteer het tweede punt.');
  assert.equal(instructions.constructionHint('lineIntersection', 1), 'Kies de tweede lijn of zijde.');
  assert.equal(instructions.describe('select', null), null);
});

test('instruction presenter retains progressive and fullscreen messaging with HTML escaping', () => {
  const instructions = setup();
  const nodes = { toolInstructions: { hidden: true, innerHTML: '' }, fullscreenHint: { innerHTML: '' }, status: { textContent: 'Klaar <nu>' } };
  const app = { tool: 'construct:lineIntersection', interaction: { mode: 'construction', sources: [{}] }, pendingText: false,
    instructionMessage: 'Extra <uitleg>', nodes };
  instructions.render(app);
  assert.equal(nodes.toolInstructions.hidden, false);
  assert.match(nodes.toolInstructions.innerHTML, /aria-current="step" class="active-step"/);
  assert.match(nodes.toolInstructions.innerHTML, /Extra &lt;uitleg&gt;/);
  assert.equal(nodes.fullscreenHint.innerHTML, nodes.toolInstructions.innerHTML);
  app.tool = 'select'; app.interaction = null; app.instructionMessage = '';
  instructions.render(app);
  assert.equal(nodes.toolInstructions.hidden, true);
  assert.equal(nodes.toolInstructions.innerHTML, '');
  assert.equal(nodes.fullscreenHint.innerHTML, 'Klaar &lt;nu&gt;');
});
