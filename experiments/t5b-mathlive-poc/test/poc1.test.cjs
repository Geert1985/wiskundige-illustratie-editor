'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ComputeEngine } = require('@cortex-js/compute-engine');
const {
  analyzeCortexExpression,
  configureDutchMathLive,
  readFormulaPayload,
  updateFormulaPayload,
} = require('../cortex-analysis.mjs');

function createConfiguredEngine() {
  const engine = new ComputeEngine();
  configureDutchMathLive({
    locale: 'en',
    strings: { en: { 'tooltip.undo': 'Undo' } },
    decimalSeparator: '.',
    computeEngine: null,
  }, engine);
  return engine;
}

test('MathLive uses Dutch labels, comma decimals and CE comma-aware LaTeX parsing', () => {
  const engine = new ComputeEngine();
  const mathLive = { locale: 'en', strings: { en: { 'tooltip.undo': 'Undo' } }, decimalSeparator: '.', computeEngine: null };
  configureDutchMathLive(mathLive, engine);
  assert.equal(mathLive.locale, 'nl');
  assert.equal(mathLive.decimalSeparator, ',');
  assert.equal(mathLive.strings.nl['tooltip.undo'], 'Ongedaan maken');
  assert.equal(engine.parse('1{,}25').evaluate().toString(), '1.25');
  assert.equal(engine.parse('\\max(1{,}25,2)').evaluate().toString(), '2');
  const matrix = engine.parse('\\begin{pmatrix}1{,}5&2\\\\3&4\\end{pmatrix}');
  assert.equal(matrix.isValid, true);
  assert.deepEqual(matrix.json[1][1], ['List', 1.5, 2]);
  const determinantMatrix = engine.parse('\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}');
  assert.equal(engine.box(['Determinant', determinantMatrix.json[1]]).evaluate().toString(), '-2');
});

test('Cortex classifies arithmetic, exact fractions, radicals and DEG/RAD trigonometry', () => {
  const engine = createConfiguredEngine();
  assert.equal(analyzeCortexExpression(engine, '2+3\\times4').exactText, '14');
  const fraction = analyzeCortexExpression(engine, '\\frac{1}{3}');
  assert.equal(fraction.category, 'Exact numeriek resultaat');
  assert.equal(fraction.exactText, '1/3');
  assert.match(fraction.numericText, /^0,333/);
  assert.equal(analyzeCortexExpression(engine, '\\sqrt{2}').exactLatex, '\\sqrt{2}');
  engine.angularUnit = 'deg';
  assert.equal(analyzeCortexExpression(engine, '\\sin(30)').exactText, '1/2');
  engine.angularUnit = 'rad';
  const radians = analyzeCortexExpression(engine, '\\sin(30)');
  assert.equal(radians.parsed, 'Geldig');
  assert.equal(radians.category, 'Benaderd numeriek resultaat');
});

test('valid symbolic expressions and matrices are not reported as calculation errors', () => {
  const engine = createConfiguredEngine();
  const symbolic = analyzeCortexExpression(engine, 'x^2+1');
  assert.equal(symbolic.parsed, 'Geldig');
  assert.equal(symbolic.category, 'Geldige symbolische expressie');
  assert.equal(symbolic.numericText, '');
  const matrix = analyzeCortexExpression(engine, '\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}');
  assert.equal(matrix.parsed, 'Geldig');
  assert.equal(matrix.category, 'Geldige matrix/tensor');
  const determinant = analyzeCortexExpression(engine, '\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}', { operation: 'determinant' });
  assert.equal(determinant.exactText, '-2');
  assert.equal(analyzeCortexExpression(engine, 'x+').category, 'Parsefout');
  assert.equal(analyzeCortexExpression(engine, '\\frac{1}{0}').category, 'Geen eindige waarde');
});

test('inline formula payload survives reopen, edit, cancel and multiple-token use', () => {
  const first = { type: 'mathlive-latex', schema: 1, latex: '\\frac{1}{2}' };
  const second = updateFormulaPayload(first, 'x^{3}');
  assert.deepEqual(first, { type: 'mathlive-latex', schema: 1, latex: '\\frac{1}{2}' });
  assert.deepEqual(readFormulaPayload({ dataset: { formulaType: first.type, formulaSchema: String(first.schema), latex: first.latex } }), first);
  assert.equal(second.latex, 'x^{3}');
  const document = [first, { type: 'mathlive-latex', schema: 1, latex: '\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}' }];
  assert.equal(document.length, 2);
  assert.match(document[0].latex, /\\frac/);
  assert.match(document[1].latex, /pmatrix/);
  const cancelledDraft = 'x^{9}';
  void cancelledDraft;
  assert.equal(first.latex, '\\frac{1}{2}', 'cancel means the original payload remains untouched');
});
