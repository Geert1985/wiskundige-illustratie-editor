'use strict';

const { ComputeEngine } = require('@cortex-js/compute-engine');

const ALLOWED = new Set(['Add', 'Subtract', 'Multiply', 'Divide', 'Power', 'Sqrt']);
const LIMITS = Object.freeze({ nodes: 128, depth: 24, sources: 8, exponent: 8 });
class HostError extends Error { constructor(code) { super(code); this.code = code; } }
const denied = (code = 'RESULT_UNAVAILABLE') => new HostError(code);
const plain = value => JSON.parse(JSON.stringify(value));
function deepFreeze(value) {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) deepFreeze(child); Object.freeze(value); }
  return value;
}

function checkedTree(input, bindings) {
  let nodes = 0, sourceCount = 0;
  function visit(node, depth = 1) {
    if (++nodes > LIMITS.nodes || depth > LIMITS.depth) throw denied('INPUT_LIMIT');
    if (typeof node === 'number' && Number.isFinite(node)) return { math: node, dimension: [0, 0, 0] };
    if (typeof node === 'string') {
      if (bindings.has(node)) {
        if (++sourceCount > LIMITS.sources) throw denied('INPUT_LIMIT');
        const binding = bindings.get(node);
        return { math: { token: node }, dimension: binding.quantity.dimension.slice() };
      }
      if (node.startsWith('wieSource_')) throw denied('UNKNOWN_BINDING');
      if (node === 'Pi' || node === 'ExponentialE') return { math: node, dimension: [0, 0, 0] };
      if (!/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(node) || ['Pi', 'ExponentialE', 'ImaginaryUnit'].includes(node)) {
        throw denied('UNSUPPORTED_EXPRESSION');
      }
      throw denied('UNBOUND_SYMBOL');
    }
    if (Array.isArray(node) && node.length > LIMITS.nodes) throw denied('INPUT_LIMIT');
    if (!Array.isArray(node) || Object.getPrototypeOf(node) !== Array.prototype || node.length < 2) throw denied('UNSUPPORTED_EXPRESSION');
    const descriptors = Object.getOwnPropertyDescriptors(node);
    const ownKeys = Reflect.ownKeys(descriptors);
    if (ownKeys.length !== node.length + 1 || ownKeys.some(k => typeof k !== 'string' || k !== 'length' && (!/^(0|[1-9]\d*)$/.test(k) || Number(k) >= node.length || !('value' in descriptors[k])))) throw denied('UNSUPPORTED_EXPRESSION');
    const [op, ...args] = node;
    if (!ALLOWED.has(op)) throw denied('UNSUPPORTED_EXPRESSION');
    if (['Add', 'Multiply'].includes(op) ? args.length < 2 : op === 'Sqrt' ? args.length !== 1 : args.length !== 2) throw denied('INVALID_ARITY');
    const children = args.map(child => visit(child, depth + 1));
    const dim = children.map(c => c.dimension);
    let out;
    if (op === 'Add' || op === 'Subtract') {
      if (dim.some(d => d.some((v, i) => v !== dim[0][i]))) throw denied('DIMENSION_MISMATCH');
      out = dim[0].slice();
    } else if (op === 'Multiply' || op === 'Divide') {
      out = [0, 1, 2].map(i => dim.reduce((v, d, n) => v + d[i] * (op === 'Divide' && n > 0 ? -1 : 1), 0));
    } else if (op === 'Power') {
      if (typeof args[1] !== 'number' || !Number.isInteger(args[1]) || Math.abs(args[1]) > LIMITS.exponent) throw denied('INVALID_POWER');
      out = dim[0].map(v => v * args[1]);
    } else {
      if (dim[0].some(v => v % 2)) throw denied('DIMENSION_MISMATCH');
      out = dim[0].map(v => v / 2);
    }
    return { math: [op, ...children], dimension: out };
  }
  const tree = visit(input);
  return { tree, nodes, sourceCount };
}

function createCortexHost({ MI, mode, engine = null, session = null, compute = null }) {
  if (!MI?.ExpressionAST || !MI?.ExpressionSources || !['author', 'restricted'].includes(mode)) throw denied('HOST_CONFIGURATION');
  if (mode === 'author' && !(engine instanceof MI.Engine) || mode === 'restricted' && !MI.RuntimeSession.isSession(session)) throw denied('HOST_CONFIGURATION');
  const sourceAdapter = mode === 'author' ? MI.ExpressionSources.createAuthor(engine) : MI.ExpressionSources.createRestricted(session);
  const computeFunction = compute || (async mathjson => {
    const ce = new ComputeEngine();
    const value = ce.box(mathjson).evaluate();
    const numeric = Number(value.numericValue);
    if (!Number.isFinite(numeric)) throw denied('NON_NUMERIC_RESULT');
    return { exact: value.json, numeric };
  });
  const entries = new Map();
  let bindingSerial = 0, formulaGeneration = 0, requestGeneration = 0, published = null;
  const currentRevision = () => mode === 'restricted' ? session.documentRevision : JSON.stringify(engine.toJSON());
  const currentEpoch = () => mode === 'restricted' ? session.permissionEpoch : 0;
  const alive = () => mode === 'author' || MI.RuntimeSession.isSession(session);
  const sourceInstance = id => mode === 'author' ? engine.model.objects.find(object => object.id === id) || null : JSON.stringify(session.engine.get(id));
  const stamp = () => ({ revision: currentRevision(), epoch: currentEpoch() });
  const sameStamp = a => alive() && a.revision === currentRevision() && a.epoch === currentEpoch();
  function read(binding) {
    const ast = MI.ExpressionEngine.decode(JSON.stringify({ schema: 1, ast: { kind: 'source', sourceId: binding.sourceId, property: binding.property } }));
    // This is the only source-read path. It invokes the real T5a source authorization facade.
    const result = sourceAdapter.evaluate(ast);
    return Object.freeze({ value: result.quantity.value, dimension: Object.freeze([...result.quantity.dimension]) });
  }
  function invalidate() { requestGeneration++; published = null; }
  const unsubscribe = mode === 'restricted' ? session.subscribe(invalidate) : () => {};

  function selectSource(sourceId, property) {
    if (typeof sourceId !== 'string' || typeof property !== 'string') throw denied();
    const before = stamp();
    let quantity;
    try { quantity = read({ sourceId, property }); } catch { throw denied('SOURCE_UNAVAILABLE'); }
    const instance = sourceInstance(sourceId);
    if (!sameStamp(before) || !instance) throw denied('SOURCE_UNAVAILABLE');
    const token = `wieSource_${++bindingSerial}_${Math.random().toString(36).slice(2)}`;
    entries.set(token, Object.freeze({ sourceId, property, quantity, instance, stamp: before }));
    return token;
  }

  function guardBinding(entry) {
    if (!sameStamp(entry.stamp) || sourceInstance(entry.sourceId) !== entry.instance) throw denied('SOURCE_UNAVAILABLE');
    const now = read(entry);
    if (now.value !== entry.quantity.value || now.dimension.some((v, i) => v !== entry.quantity.dimension[i])) throw denied('SOURCE_UNAVAILABLE');
  }

  async function evaluate(mathjson, { generation = formulaGeneration } = {}) {
    const request = ++requestGeneration;
    published = null;
    const operationStamp = stamp();
    try {
      if (generation !== formulaGeneration) throw denied('STALE_RESULT');
      const validated = checkedTree(mathjson, entries);
      const referenced = [...new Set(collectTokens(validated.tree))];
      for (const token of referenced) guardBinding(entries.get(token));
      if (!sameStamp(operationStamp)) throw denied();
      const safeMath = replaceTokens(validated.tree, entries);
      const pending = await computeFunction(safeMath);
      if (!pending || !Number.isFinite(pending.numeric)) throw denied('NON_FINITE_RESULT');
      if (request !== requestGeneration || generation !== formulaGeneration || !sameStamp(operationStamp)) throw denied('STALE_RESULT');
      for (const token of referenced) guardBinding(entries.get(token));
      if (request !== requestGeneration || generation !== formulaGeneration) throw denied('STALE_RESULT');
      const exact = pending.exact && typeof pending.exact === 'object' ? deepFreeze(plain(pending.exact)) : pending.exact;
      const result = Object.freeze({ status: 'numeric', exact, value: pending.numeric, dimension: Object.freeze(validated.tree.dimension.slice()), formulaGeneration: generation, requestGeneration: request });
      published = result;
      return result;
    } catch (error) {
      if (request === requestGeneration) published = null;
      throw error instanceof HostError ? error : denied('COMPUTATION_FAILED');
    }
  }

  function setFormulaGeneration(value) { if (!Number.isSafeInteger(value) || value < formulaGeneration) throw denied('INVALID_GENERATION'); formulaGeneration = value; invalidate(); }
  function canCopy(result) {
    if (!result || result !== published || result.requestGeneration !== requestGeneration || result.formulaGeneration !== formulaGeneration || !alive()) return false;
    try {
      for (const entry of entries.values()) guardBinding(entry);
      return result === published && result.requestGeneration === requestGeneration;
    } catch { published = null; return false; }
  }
  function close() { invalidate(); unsubscribe(); entries.clear(); }
  return Object.freeze({ selectSource, evaluate, setFormulaGeneration, canCopy, close, limits: LIMITS });
}

function collectTokens(tree, out = []) {
  if (tree.math && typeof tree.math === 'object' && Object.hasOwn(tree.math, 'token')) out.push(tree.math.token);
  else if (Array.isArray(tree.math)) for (const child of tree.math.slice(1)) collectTokens(child, out);
  return out;
}
function replaceTokens(tree, entries) {
  if (tree.math && typeof tree.math === 'object' && Object.hasOwn(tree.math, 'token')) {
    const q = entries.get(tree.math.token).quantity;
    return q.value;
  }
  if (Array.isArray(tree.math)) return [tree.math[0], ...tree.math.slice(1).map(child => replaceTokens(child, entries))];
  return tree.math;
}

module.exports = { createCortexHost, checkedTree, LIMITS };
