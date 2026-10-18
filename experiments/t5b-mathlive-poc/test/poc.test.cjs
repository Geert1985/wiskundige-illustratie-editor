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
