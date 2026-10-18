const test = require('node:test');
const assert = require('node:assert/strict');
(async () => {
  const { ComputeEngine } = await import('@cortex-js/compute-engine');
  const { MockGeometrySources } = await import('../geometry-poc.mjs');
  const { evaluateBoundMathJson, presentationUnit, toPresentationValue } = await import('../structural-binding.mjs');
  const ce = new ComputeEngine();
  const tokenA = 'wieSourceA', tokenB = 'wieSourceB';
  function source(value, unit='cm', id='circle-1', token=tokenA) {
    const p = new MockGeometrySources();
    p.update(id, { radius: value, unit });
    const binding = p.selectBinding(id, token);
    return { p, binding };
  }
  function angleSource(value, unit='deg') {
    const p = new MockGeometrySources();
    p.update('angle-1', { angle: value, angleUnit: unit });
    const binding = p.selectBinding('angle-1', tokenA, 'angle');
    return { p, binding };
  }
  function evalTree(tree, { value=2, unit='cm', bindings, provider, angleMode='rad' }={}) {
    if (!provider) { const fixture = source(value, unit); provider = fixture.p; bindings = [fixture.binding]; }
    return evaluateBoundMathJson(ce, tree, bindings, provider, { angleMode });
  }
  test('mm, cm and m source values normalize to canonical meters and can be presented in chosen units', () => {
    for (const [value, unit] of [[20,'mm'],[2,'cm'],[.02,'m']]) {
      const result = evalTree(tokenA, { value, unit });
      assert.equal(result.numericValue, .02);
      assert.deepEqual(result.dimension, { length: 1 });
      assert.deepEqual(toPresentationValue(result.numericValue, result.dimension, 'cm'), { value: 2, unit: 'cm' });
    }
  });
  test('circle area and circumference are dimensioned in SI and presentable in centimeters', () => {
    const f = source(2, 'cm');
    const area = evalTree(['Multiply', 'Pi', ['Power', tokenA, 2]], { provider: f.p, bindings: [f.binding] });
    const perimeter = evalTree(['Multiply', 2, 'Pi', tokenA], { provider: f.p, bindings: [f.binding] });
    assert.deepEqual(area.dimension, { length: 2 });
    assert.ok(Math.abs(toPresentationValue(area.numericValue, area.dimension, 'cm').value - 4*Math.PI) < 1e-12);
    assert.deepEqual(perimeter.dimension, { length: 1 });
    assert.ok(Math.abs(toPresentationValue(perimeter.numericValue, perimeter.dimension, 'cm').value - 4*Math.PI) < 1e-12);
    assert.match(area.exactExpression, /pi/i);
    assert.equal(presentationUnit(area.dimension, 'cm'), 'cm²');
  });
  test('r+r, r², r/r and sqrt(r²) have the expected dimensions', () => {
    const f = source(2, 'cm');
    const run = tree => evalTree(tree, { provider: f.p, bindings: [f.binding] });
    assert.deepEqual(run(['Add', tokenA, tokenA]).dimension, { length: 1 });
    assert.deepEqual(run(['Power', tokenA, 2]).dimension, { length: 2 });
    assert.deepEqual(run(['Divide', tokenA, tokenA]).dimension, {});
    const root = run(['Sqrt', ['Power', tokenA, 2]]);
    assert.deepEqual(root.dimension, { length: 1 });
    assert.equal(root.numericValue, .02);
  });
  test('incompatible dimensions fail before CortexJS evaluation', () => {
    const length = source(2, 'cm');
    const angle = angleSource(30, 'deg');
    const bindings = [length.binding, { ...angle.binding, token: tokenB }];
    const provider = { resolveTyped(binding) { return binding.sourceId === 'circle-1' ? length.p.resolveTyped(binding) : angle.p.resolveTyped({ ...binding, token: tokenA }); } };
    let evaluated = false;
    assert.throws(() => evaluateBoundMathJson({ box() { evaluated = true; } }, ['Add', tokenA, tokenB], bindings, provider), e => e.code === 'DIMENSION_CONFLICT');
    assert.equal(evaluated, false);
    assert.throws(() => evalTree(['Add', tokenA, ['Power', tokenA, 2]], { provider: length.p, bindings: [length.binding] }), e => e.code === 'DIMENSION_CONFLICT');
  });
  test('multiple length sources with distinct units add after canonical conversion', () => {
    const a = source(20, 'mm');
    const b = source(2, 'cm', 'circle-2', tokenB);
    const provider = { resolveTyped(binding) { return binding.sourceId === 'circle-1' ? a.p.resolveTyped(binding) : b.p.resolveTyped(binding); } };
    const result = evalTree(['Add', tokenA, tokenB], { provider, bindings: [a.binding, b.binding] });
    assert.equal(result.numericValue, .04);
    assert.deepEqual(result.dimension, { length: 1 });
  });
  test('typed DEG and RAD sources normalize to radians; dimensionless DEG mode is honored', () => {
    const degrees = angleSource(30, 'deg'), radians = angleSource(Math.PI/6, 'rad');
    const degResult = evalTree(['Sin', tokenA], { provider: degrees.p, bindings: [degrees.binding] });
    const radResult = evalTree(['Sin', tokenA], { provider: radians.p, bindings: [radians.binding] });
    const modeResult = evalTree(['Sin', 30], { angleMode: 'deg' });
    for (const result of [degResult, radResult, modeResult]) assert.ok(Math.abs(result.numericValue - .5) < 1e-12);
  });
  test('division by zero, invalid powers, invalid roots, and unknown source dimensions are rejected', () => {
    assert.throws(() => evalTree(['Divide', 1, 0]), e => e.code === 'CALCULATION_FAILED');
    assert.throws(() => evalTree(1, { angleMode: 'grad' }), e => e.code === 'INVALID_ANGLE_MODE');
    assert.throws(() => evalTree(['Power', tokenA, .5]), e => e.code === 'INVALID_POWER');
    assert.throws(() => evalTree(['Sqrt', tokenA]), e => e.code === 'DIMENSION_CONFLICT');
    const f = source(1);
    const badProvider = { resolveTyped() { return { value: 1, unit: 'm', dimension: { time: 1 }, instanceGeneration: 1 }; } };
    assert.throws(() => evalTree(tokenA, { provider: badProvider, bindings: [f.binding] }), e => e.code === 'INVALID_SOURCE_DIMENSION');
  });
  test('symbolic expressions with unknown source dimensions are not reported as dimensionally valid', () => {
    const f = source(2);
    assert.throws(() => evalTree(['Add', tokenA, 'x'], { provider: f.p, bindings: [f.binding] }), e => e.code === 'DIMENSION_UNDETERMINED');
    const symbolic = evaluateBoundMathJson(ce, ['Add', 'x', 1], [], { resolveTyped() { throw Error(); } });
    assert.equal(symbolic.dimension, null);
    assert.equal(symbolic.numericValue, undefined);
  });
})();
