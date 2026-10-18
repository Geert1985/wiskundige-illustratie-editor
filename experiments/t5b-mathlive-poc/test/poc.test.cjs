'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ExpressionEngine = require(path.resolve(__dirname, '../../../expression-engine.js'));

test('T5a path evaluates the supported T5b sample set with explicit DEG mode', () => {
  const cases = [
    ['2+3*4', 14],
    ['sqrt(81)', 9],
    ['sin(30 deg)', 0.5],
    ['pi*2^2', Math.PI * 4],
  ];
  for (const [input, expected] of cases) {
    const result = ExpressionEngine.evaluate(ExpressionEngine.parse(input), { angleMode: 'deg' });
    assert.ok(Math.abs(result.quantity.value - expected) <= 1e-12, input);
  }
});

test('POC display formatter trims padding without changing exact values or approximation markers', async () => {
  const { compactFormattedResult } = await import('../display-format.mjs');
  const cases = [
    ['2+3*4', 14, '14', false],
    ['sqrt(81)', 9, '9', false],
    ['0.25', 0.25, '0,25', false],
    ['1/4', 0.25, '0,25', false],
    ['sin(30 deg)', 0.49999999999999994, '≈0,5', true],
    ['-2.5', -2.5, '-2,5', false],
    ['0', 0, '0', false],
    ['1/3', 1 / 3, '≈0,33333333', true],
    ['pi*2^2', Math.PI * 4, '≈12,56637061', true],
  ];

  for (const [input, expected, display, approximate] of cases) {
    const ast = ExpressionEngine.parse(input);
    const quantity = ExpressionEngine.evaluate(ast, { angleMode: 'deg' }).quantity;
    const formatted = ExpressionEngine.format(quantity, { precision: 8 });
    assert.equal(formatted.approximate, approximate, input);
    assert.equal(compactFormattedResult(formatted), display, input);
    assert.equal(formatted.quantity.value, expected, `${input} numeric value remains untouched`);
  }
});

test('POC display formatter preserves approximation at a rounded zero and preserves unit suffixes', async () => {
  const { compactFormattedResult } = await import('../display-format.mjs');
  const tiny = ExpressionEngine.format(ExpressionEngine.quantity(1e-10), { precision: 8 });
  assert.equal(tiny.approximate, true);
  assert.equal(tiny.roundedNonzero, true);
  assert.equal(compactFormattedResult(tiny), '≈0');
  assert.equal(tiny.quantity.value, 1e-10);

  const length = ExpressionEngine.quantity(0.0125, [1, 0, 0]);
  const withUnit = ExpressionEngine.format(length, { precision: 8, unit: { name: 'cm', exponent: 1 } });
  assert.equal(compactFormattedResult(withUnit), '1,25 cm');
});

test('Compute Engine can evaluate the same dimensionless MathLive LaTeX examples', async () => {
  const { ComputeEngine } = await import('@cortex-js/compute-engine');
  const ce = new ComputeEngine();
  const cases = [
    ['2+3\\times4', 14],
    ['\\sqrt{81}', 9],
    ['\\sin(30\\,\\mathrm{deg})', 0.5],
    ['\\pi\\times2^2', Math.PI * 4],
  ];
  for (const [latex, expected] of cases) {
    const result = ce.parse(latex).N();
    assert.ok(Math.abs(result.re - expected) <= 1e-12, latex);
  }
});
