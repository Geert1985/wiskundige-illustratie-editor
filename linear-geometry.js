/* Domain and viewport operations shared by all two-point linear objects. */
(function(global) {
  const MI = global.FZI.MathIllustration;
  const types = new Set(MI.LINEAR_OBJECT_TYPES);
  function domain(object) { return object.type === 'straight' ? [-Infinity, Infinity] : object.type === 'ray' ? [0, Infinity] : [0, 1]; }
  function accepts(object, t) { const [low, high] = domain(object); return t >= low - 1e-9 && t <= high + 1e-9; }
  function clip(object, bounds) {
    let [low, high] = domain(object); const dx = object.x2 - object.x1, dy = object.y2 - object.y1;
    if (dx === 0 && dy === 0) return object.x1 >= bounds.xMin && object.x1 <= bounds.xMax && object.y1 >= bounds.yMin && object.y1 <= bounds.yMax ? { start: { x: object.x1, y: object.y1 }, end: { x: object.x1, y: object.y1 }, low: 0, high: 0 } : null;
    for (const [origin, delta, min, max] of [[object.x1, dx, bounds.xMin, bounds.xMax], [object.y1, dy, bounds.yMin, bounds.yMax]]) {
      if (delta === 0) { if (origin < min || origin > max) return null; continue; }
      const a = (min - origin) / delta, b = (max - origin) / delta;
      low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b));
      if (low > high) return null;
    }
    const start = { x: object.x1 + low * dx, y: object.y1 + low * dy }, end = { x: object.x1 + high * dx, y: object.y1 + high * dy };
    return [start.x, start.y, end.x, end.y].every(Number.isFinite) ? { start, end, low, high } : null;
  }
  function intersect(a, b) {
    const dx = a.x2 - a.x1, dy = a.y2 - a.y1, ex = b.x2 - b.x1, ey = b.y2 - b.y1, cross = dx * ey - dy * ex;
    if (Math.abs(cross) < 1e-10) return null;
    const qx = b.x1 - a.x1, qy = b.y1 - a.y1, t = (qx * ey - qy * ex) / cross, u = (qx * dy - qy * dx) / cross;
    return accepts(a, t) && accepts(b, u) ? { x: a.x1 + t * dx, y: a.y1 + t * dy } : null;
  }
  MI.LinearGeometry = { isLinear: object => object && types.has(object.type), domain, accepts, clip, intersect };
})(window);
