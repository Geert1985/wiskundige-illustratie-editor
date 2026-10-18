const UNITS = Object.freeze({ mm: 0.1, cm: 1, m: 100 }); // Canonical length: centimetres

export class MockGeometrySources {
  constructor() {
    this.revision = 0;
    this.sources = new Map([['circle-1', { kind: 'circle', radius: 2, unit: 'cm', valid: true, accessible: true }]]);
  }
  update(id, patch) { const s = this.sources.get(id) || { kind: 'circle', radius: 2, unit: 'cm', valid: true, accessible: true }; Object.assign(s, patch); this.sources.set(id, s); this.revision++; }
  remove(id) { this.sources.delete(id); this.revision++; }
  resolve(binding) {
    const s = this.sources.get(binding.sourceId);
    if (!s || !s.accessible || !s.valid || binding.property !== 'radius' || !UNITS[s.unit] || !Number.isFinite(s.radius) || s.radius < 0)
      throw new Error('Geometrische bron niet beschikbaar');
    return { value: s.radius * UNITS[s.unit], dimension: { length: 1 }, revision: this.revision };
  }
}

export function convertLength(value, unit) {
  if (!UNITS[unit]) throw new Error('Onbekende lengte-eenheid');
  return value * UNITS[unit];
}
export function multiplyDimensions(a, b) {
  return Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])]
    .map(key => [key, (a[key] || 0) + (b[key] || 0)]).filter(([, power]) => power));
}
export function addDimensions(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  if ([...keys].some(key => (a[key] || 0) !== (b[key] || 0))) throw new Error('Eenheden/dimensies zijn niet compatibel');
  return { ...a };
}

// Latest-request wins; authorization and source revision are rechecked after async evaluation.
export function createRevisionGuard(sources) {
  let generation = 0;
  return async function evaluate(binding, evaluateValue) {
    const request = ++generation;
    const source = sources.resolve(binding);
    const revision = source.revision;
    const result = await evaluateValue(source.value);
    if (request !== generation || sources.revision !== revision) return { current: false, reason: 'bron gewijzigd tijdens berekening' };
    try { sources.resolve(binding); } catch { return { current: false, reason: 'bron niet beschikbaar' }; }
    return { current: true, result, revision };
  };
}
