const OPS = new Set(['Add', 'Subtract', 'Multiply', 'Divide', 'Power', 'Sqrt', 'Sin', 'Cos', 'Tan']);
const RESERVED = 'wieSource';
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function fail(code) { throw Object.assign(new Error(code), { code }); }

function normalizeDimension(dimension) {
  if (!dimension || typeof dimension !== 'object' || Array.isArray(dimension)) fail('INVALID_SOURCE_DIMENSION');
  const out = {};
  for (const key of Object.keys(dimension)) {
    if (!['length', 'angle'].includes(key) || !Number.isInteger(dimension[key]) || Math.abs(dimension[key]) > 16) fail('INVALID_SOURCE_DIMENSION');
    if (dimension[key]) out[key] = dimension[key];
  }
  return out;
}
function sameDimension(a, b) {
  if (a === null || b === null) return a === b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every(key => (a[key] || 0) === (b[key] || 0));
}
function combineDimensions(dimensions, signForIndex) {
  if (dimensions.some(d => d === null)) return null;
  const out = {};
  dimensions.forEach((dimension, i) => {
    for (const [key, exponent] of Object.entries(dimension)) {
      out[key] = (out[key] || 0) + signForIndex(i) * exponent;
      if (!out[key]) delete out[key];
    }
  });
  return out;
}

/** Validates the entire tree before returning dimensions, including all n-ary operands. */
export function validateTree(node, table, { maxNodes = 256, maxDepth = 32, maxSources = 64, angleMode = 'rad' } = {}) {
  let count = 0, sourceCount = 0;
  const refs = [], unknownSymbols = new Set();
  function walk(n, depth = 1) {
    if (++count > maxNodes || depth > maxDepth) fail('INPUT_LIMIT');
    if (typeof n === 'string') {
      if (own(table, n)) {
        if (++sourceCount > maxSources) fail('INPUT_LIMIT');
        refs.push(n);
        return normalizeDimension(table[n].dimension);
      }
      if (n.startsWith(RESERVED)) fail('UNKNOWN_BINDING');
      if (['Pi', 'ExponentialE', 'ImaginaryUnit'].includes(n)) return {};
      unknownSymbols.add(n);
      return null;
    }
    if (typeof n === 'number') { if (!Number.isFinite(n)) fail('INVALID_NUMBER'); return {}; }
    if (!Array.isArray(n) || typeof n[0] !== 'string' || !OPS.has(n[0])) fail('UNSUPPORTED_EXPRESSION');
    const [op, ...args] = n;
    if ((['Add', 'Multiply'].includes(op) && args.length < 2) || (['Subtract', 'Divide', 'Power'].includes(op) && args.length !== 2) || (['Sqrt', 'Sin', 'Cos', 'Tan'].includes(op) && args.length !== 1)) fail('UNSUPPORTED_EXPRESSION');
    const childDimensions = args.map(arg => walk(arg, depth + 1));
    if (op === 'Add' || op === 'Subtract') {
      if (childDimensions.some(d => d === null)) return null;
      if (childDimensions.some(d => !sameDimension(d, childDimensions[0]))) fail('DIMENSION_CONFLICT');
      return childDimensions[0];
    }
    if (op === 'Multiply' || op === 'Divide') {
      return combineDimensions(childDimensions, i => op === 'Multiply' || i === 0 ? 1 : -1);
    }
    if (op === 'Power') {
      const exponent = args[1];
      if (typeof exponent !== 'number' || !Number.isInteger(exponent) || Math.abs(exponent) > 8) fail('INVALID_POWER');
      if (childDimensions[0] === null) return null;
      return Object.fromEntries(Object.entries(childDimensions[0]).map(([k, v]) => [k, v * exponent]).filter(([, v]) => v));
    }
    if (op === 'Sqrt') {
      const d = childDimensions[0];
      if (d === null) return null;
      if (Object.values(d).some(v => v % 2)) fail('DIMENSION_CONFLICT');
      return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v / 2]).filter(([, v]) => v));
    }
    if (['Sin', 'Cos', 'Tan'].includes(op)) {
      const d = childDimensions[0];
      if (d === null) return null;
      if (Object.keys(d).length && !(Object.keys(d).length === 1 && d.angle === 1)) fail('DIMENSION_CONFLICT');
      return {};
    }
  }
  const dimension = walk(node);
  if (refs.length && unknownSymbols.size) fail('DIMENSION_UNDETERMINED');
  return { dimension, refs: Object.freeze([...new Set(refs)]), sourceReferences: sourceCount, nodes: count, unknownSymbols: Object.freeze([...unknownSymbols]) };
}

function substitute(node, values) {
  if (typeof node === 'string') return own(values, node) ? values[node] : node;
  if (!Array.isArray(node)) return node;
  return node.map((x, i) => i === 0 ? x : substitute(x, values));
}
function canonicalQuantity(q) {
  if (!q || !Number.isFinite(q.value)) fail('SOURCE_UNAVAILABLE');
  const dimension = normalizeDimension(q.dimension);
  let value = q.value;
  if (dimension.length === 1) {
    const factors = { mm: .001, cm: .01, m: 1 };
    const unit = q.unit || q.canonicalUnit;
    if (!(unit in factors)) fail('INVALID_SOURCE_UNIT');
    value *= factors[unit];
  } else if (dimension.angle === 1) {
    const factors = { deg: Math.PI / 180, rad: 1 };
    const unit = q.unit || q.canonicalUnit;
    if (!(unit in factors)) fail('INVALID_SOURCE_UNIT');
    value *= factors[unit];
  } else if (q.unit && q.unit !== '1') fail('INVALID_SOURCE_UNIT');
  if (!Number.isFinite(value)) fail('INVALID_NUMBER');
  return { value, dimension, precision: q.precision || 'measured', revision: q.revision, instanceGeneration: q.instanceGeneration };
}
export function presentationUnit(dimension, lengthUnit = 'm', angleUnit = 'rad') {
  if (!dimension) return '';
  if (dimension.angle === 1 && Object.keys(dimension).length === 1) return angleUnit;
  if (dimension.length === 1 && Object.keys(dimension).length === 1) return lengthUnit;
  if (dimension.length === 2 && Object.keys(dimension).length === 1) return `${lengthUnit}²`;
  if (!Object.keys(dimension).length) return '';
  return Object.entries(dimension).map(([key, power]) => `${key}${power === 1 ? '' : `^${power}`}`).join('·');
}
export function toPresentationValue(value, dimension, lengthUnit = 'm', angleUnit = 'rad') {
  if (!Number.isFinite(value)) fail('CALCULATION_FAILED');
  const unit = presentationUnit(dimension, lengthUnit, angleUnit);
  const factors = { mm: 1000, cm: 100, m: 1, 'mm²': 1e6, 'cm²': 1e4, 'm²': 1, rad: 1, deg: 180 / Math.PI, '': 1 };
  if (!(unit in factors)) fail('UNSUPPORTED_PRESENTATION_UNIT');
  return { value: value * factors[unit], unit };
}

export function evaluateBoundMathJson(engine, tree, bindings, provider, options = {}) {
  if (options.angleMode !== undefined && !['deg', 'rad'].includes(options.angleMode)) fail('INVALID_ANGLE_MODE');
  if (!Array.isArray(bindings)) fail('INVALID_BINDINGS');
  const table = Object.create(null);
  for (const b of bindings) {
    if (!b || typeof b.token !== 'string' || !b.token.startsWith(RESERVED) || typeof b.sourceId !== 'string' || !Number.isSafeInteger(b.instanceGeneration) || typeof b.property !== 'string' || own(table, b.token)) fail('INVALID_BINDING');
    table[b.token] = b;
  }
  // First pass validates structure and gathers explicit token references without evaluating anything.
  const structural = validateTree(tree, Object.fromEntries(Object.keys(table).map(token => [token, { dimension: {} }])), options);
  const quantities = Object.create(null), dimensions = Object.create(null);
  for (const token of structural.refs) {
    const b = table[token];
    try {
      const q = canonicalQuantity(typeof provider.resolveTyped === 'function' ? provider.resolveTyped(b) : provider.resolve(b));
      if (q.instanceGeneration !== undefined && q.instanceGeneration !== b.instanceGeneration) fail('SOURCE_UNAVAILABLE');
      quantities[token] = q.value;
      dimensions[token] = { ...b, dimension: q.dimension };
    } catch (e) { if (e?.code && e.code !== 'SOURCE_UNAVAILABLE') throw e; fail('SOURCE_UNAVAILABLE'); }
  }
  const analysis = validateTree(tree, dimensions, options);
  if (analysis.dimension === null && analysis.refs.length) fail('DIMENSION_UNDETERMINED');
  // DEG applies only to dimensionless trig arguments. Typed angle sources are canonical radians.
  let evaluableTree = tree;
  if (options.angleMode === 'deg') {
    const toRadians = n => {
      if (!Array.isArray(n)) return n;
      const [op, ...args] = n;
      const mapped = args.map(toRadians);
      if (['Sin', 'Cos', 'Tan'].includes(op) && analysis.dimension !== null) {
        const argDim = (() => { try { return validateTree(args[0], dimensions, options).dimension; } catch { return null; } })();
        if (argDim && Object.keys(argDim).length === 0) return [op, ['Divide', ['Multiply', mapped[0], 'Pi'], 180]];
      }
      return [op, ...mapped];
    };
    evaluableTree = toRadians(tree);
  }
  let evaluated, exactExpression;
  try { const boxed = engine.box(substitute(evaluableTree, quantities)); exactExpression = boxed.toString(); evaluated = boxed.evaluate(); } catch { fail('CALCULATION_FAILED'); }
  if (!evaluated?.isValid || evaluated.isNaN || evaluated.isInfinity) fail('CALCULATION_FAILED');
  const numericRaw = evaluated.N?.().numericValue;
  const numericValue = numericRaw === undefined ? undefined : Number(numericRaw.valueOf?.() ?? numericRaw);
  if (numericValue !== undefined && !Number.isFinite(numericValue)) fail('CALCULATION_FAILED');
  const resultDimension = analysis.dimension;
  return { expression: evaluated, exactExpression, numericValue, dimension: resultDimension, quantity: numericValue === undefined || resultDimension === null ? null : { value: numericValue, dimension: resultDimension, canonicalUnit: presentationUnit(resultDimension) || '1' }, refs: analysis.refs, sourceQuality: analysis.refs.length ? 'measured' : 'symbolic', symbolicExactness: evaluated.isExact === true };
}

export function sourceLatex(token) {
  if (!token?.startsWith(RESERVED) || !/^[A-Za-z0-9]+$/.test(token)) fail('INVALID_BINDING');
  return `\\mathrm{${token}}`;
}
export function evaluateMathLiveLatex(engine, latex, bindings, provider, options = {}) {
  if (typeof latex !== 'string' || latex.length > (options.maxCharacters || 2048)) fail('INPUT_LIMIT');
  let parsed;
  try { parsed = engine.parse(latex); } catch { fail('INVALID_MATH'); }
  if (!parsed?.isValid) fail('INVALID_MATH');
  return evaluateBoundMathJson(engine, parsed.json, bindings, provider, options);
}
